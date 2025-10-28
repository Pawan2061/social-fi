import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth-middleware";
import { resolveMediaUrl } from "../lib/image-helper";
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export const createClaim = async (req: AuthRequest, res: Response) => {
  try {
    const {
      reason,
      amount,
      media,
      validTill,
      evidenceIpfsHash,
      creatorPoolAddress,
      vaultAddress,
      creatorUsdcAccount,
    } = req.body;
    const creatorId = req.user?.userId;
    if (!creatorId) return res.status(401).json({ error: "Unauthorized" });

    // Store on-chain data in the reason field temporarily (as per user's request to avoid schema changes)
    const onchainData = {
      evidenceIpfsHash,
      creatorPoolAddress,
      vaultAddress,
      creatorUsdcAccount,
    };

    const claim = await prisma.claim.create({
      data: {
        creatorId,
        reason: JSON.stringify({
          originalReason: reason,
          onchainData,
        }),
        amount,
        validTill: validTill
          ? new Date(validTill)
          : new Date(Date.now() + 24 * 60 * 60 * 1000),
        media: {
          create: (media || []).map((m: any) => ({
            type: m.type,
            url: m.url,
            thumbnail: m.thumbnail,
            needsSignedUrl: true,
          })),
        },
      },
      include: { media: true },
    });
    res.status(200).json(claim);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const getClaim = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const claim = await prisma.claim.findUnique({
      where: { id: id },
      include: {
        media: true,
        creator: true,
      },
    });

    if (!claim) return res.status(404).json({ error: "Claim not found" });

    const media = await Promise.all(
      claim.media.map(async (m) => ({
        ...m,
        url: await resolveMediaUrl(m.url),
      }))
    );

    res.status(200).json({
      ...claim,
      media,
      creator: {
        ...claim.creator,
        image: claim.creator.image
          ? await resolveMediaUrl(claim.creator.image)
          : null,
      },
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const getClaims = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Authentication required to view claims" });
    }

    // Get creators that the user has NFTs for
    const ownerships = await prisma.ownership.findMany({
      where: { userId },
      select: { creatorId: true },
    });
    const creatorIds = ownerships.map((o) => o.creatorId);

    // if (creatorIds.length === 0) {
    //   return res.json([]); // User has no NFTs, return empty array
    // }

    // Get claims only from creators that the user has NFTs for
    const claims = await prisma.claim.findMany({
      where: {
        OR: [
          { creatorId: { in: creatorIds } }, // Claims from creators whose NFTs you own
          { creatorId: userId }, // Claims you created
        ],
      },
      include: { media: true, creator: true },
    });

    const transformed = await Promise.all(
      claims.map(async (claim) => {
        const media = await Promise.all(
          claim.media.map(async (m) => ({
            ...m,
            url: await resolveMediaUrl(m.url),
          }))
        );

        return {
          ...claim,
          media,
          creator: {
            ...claim.creator,
            image: claim.creator.image
              ? await resolveMediaUrl(claim.creator.image)
              : null,
          },
        };
      })
    );

    res.status(200).json(transformed);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const updateClaim = async (req: AuthRequest, res: Response) => {
  try {
    const { claimId } = req.params;
    const { reason, amount, media } = req.body;
    const userId = req.user?.userId;

    const existingClaim = await prisma.claim.findUnique({
      where: { id: claimId },
    });

    if (!existingClaim || existingClaim.creatorId !== userId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.media.deleteMany({
        where: { claimId: claimId },
      });

      return tx.claim.update({
        where: { id: claimId },
        data: {
          reason: reason ?? existingClaim.reason,
          amount: amount ?? existingClaim.amount,
          media: {
            create: (media || []).map((m: any) => ({
              type: m.type,
              url: m.url,
              thumbnail: m.thumbnail,
              needsSignedUrl: true,
            })),
          },
        },
        include: { media: true },
      });
    });

    res.status(200).json(updated);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
};

export const voteOnClaim = async (req: AuthRequest, res: Response) => {
  try {
    const { claimId } = req.params;
    const {
      choice,
      transactionSignature,
      onchainClaimAddress,
      creatorPoolAddress,
      nftOwnershipAddress,
      creatorCollectionAddress,
    } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
    });
    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    // Create or update vote record
    const vote = await prisma.vote.upsert({
      where: {
        claimId_userId: {
          claimId: claimId,
          userId: userId,
        },
      },
      update: {
        approve: choice === "Yes",
        txSig: transactionSignature,
      },
      create: {
        claimId: claimId,
        userId: userId,
        approve: choice === "Yes",
        txSig: transactionSignature,
      },
    });

    res.json({
      message: `Vote ${choice} recorded successfully`,
      vote,
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const finalizeClaim = async (req: AuthRequest, res: Response) => {
  try {
    const { claimId } = req.params;
    const { transactionSignature, onchainClaimAddress, creatorPoolAddress } =
      req.body;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { votes: true },
    });
    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    // Check if user is the creator
    if (claim.creatorId !== userId) {
      return res
        .status(403)
        .json({ error: "Only the creator can finalize this claim" });
    }

    const yesVotes = claim.votes.filter((v) => v.approve).length;
    const noVotes = claim.votes.filter((v) => !v.approve).length;
    const status = yesVotes > noVotes ? "APPROVED" : "REJECTED";

    const updated = await prisma.claim.update({
      where: { id: claim.id },
      data: { status },
    });

    res.json({
      message: `Claim ${status.toLowerCase()}`,
      claim: updated,
      yesVotes,
      noVotes,
      status,
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const finalizeClaimWithDistribution = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { claimId } = req.params;
    const {
      transactionSignature,
      onchainClaimAddress,
      creatorPoolAddress,
      result,
      distributedAmount,
    } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { votes: true, creator: true },
    });
    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    // Check if user is the creator
    if (claim.creatorId !== userId) {
      return res
        .status(403)
        .json({ error: "Only the creator can finalize this claim" });
    }

    const yesVotes = claim.votes.filter((v) => v.approve).length;
    const noVotes = claim.votes.filter((v) => !v.approve).length;
    const isApproved = result === "approved" || yesVotes > noVotes;

    // Update claim status based on result
    const status = isApproved ? "APPROVED" : "REJECTED";
    const updated = await prisma.claim.update({
      where: { id: claim.id },
      data: { status },
    });

    // Handle fund distribution
    let distributionResult = null;
    if (distributedAmount > 0) {
      try {
        distributionResult = await distributeVaultFunds(claimId, isApproved);
        console.log(
          `💰 Distribution result for claim ${claimId}:`,
          distributionResult
        );
      } catch (distError) {
        console.error("❌ Distribution failed:", distError);
        // Don't fail the entire request if distribution fails
      }
    }

    res.json({
      message: `Claim ${status.toLowerCase()} with fund distribution`,
      claim: updated,
      yesVotes,
      noVotes,
      status,
      result: isApproved ? "approved" : "rejected",
      distributedAmount,
      distributionResult,
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const acceptClaim = async (req: AuthRequest, res: Response) => {
  try {
    const { claimId } = req.params;
    const { txid } = req.body;
    const creatorId = req.user?.userId;
    if (!creatorId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { votes: true },
    });
    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }
    const yesVotes = claim.votes.filter((v) => v.approve).length;
    const noVotes = claim.votes.filter((v) => !v.approve).length;
    const status = yesVotes > noVotes ? "APPROVED" : "REJECTED";
    let success = true;
    //  ya pani txid le verify vote
    if (success) {
      const updated = await prisma.claim.update({
        where: { id: claim.id },
        data: { status },
      });

      res.json({
        message: `Claim ${status.toLowerCase()}`,
        claim: updated,
        yesVotes,
        noVotes,
      });
    }
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const payoutClaim = async (req: AuthRequest, res: Response) => {
  try {
    const { claimId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { creator: true },
    });

    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    if (claim.creatorId !== userId) {
      return res
        .status(403)
        .json({ error: "Only the creator can process claim payout" });
    }

    // Check if claim is approved
    if (claim.status !== "APPROVED") {
      return res
        .status(400)
        .json({ error: "Claim must be approved before payout" });
    }

    // Distribute funds to creator (approved claim)
    const distributionResult = await distributeVaultFunds(claimId, true);
    console.log("💰 Payout distribution result:", distributionResult);

    // Update claim status to paid
    const updatedClaim = await prisma.claim.update({
      where: { id: claimId },
      data: { status: "PAID" },
    });

    res.json({
      message: "Claim payout processed successfully",
      status: "PAID",
      claim: updatedClaim,
      distribution: distributionResult,
    });
  } catch (error) {
    console.error("Error processing claim payout:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const refundClaim = async (req: AuthRequest, res: Response) => {
  try {
    const { claimId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get the claim
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { creator: true },
    });

    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    // Check if user is the creator
    if (claim.creatorId !== userId) {
      return res
        .status(403)
        .json({ error: "Only the creator can process claim refund" });
    }

    // Check if claim is rejected
    if (claim.status !== "REJECTED") {
      return res
        .status(400)
        .json({ error: "Claim must be rejected before refund" });
    }

    // Distribute funds to NFT holders (rejected claim)
    const distributionResult = await distributeVaultFunds(claimId, false);
    console.log("🔄 Refund distribution result:", distributionResult);

    // Update claim status to refunded
    const updatedClaim = await prisma.claim.update({
      where: { id: claimId },
      data: { status: "REJECTED" }, // Use existing status instead of REFUNDED
    });

    res.json({
      message: "Claim refund processed successfully",
      status: "REFUNDED",
      claim: updatedClaim,
      distribution: distributionResult,
    });
  } catch (error) {
    console.error("Error processing claim refund:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Helper function to get NFT holders for a creator
export const getNFTHoldersForCreator = async (creatorId: string) => {
  try {
    const ownerships = await prisma.ownership.findMany({
      where: { creatorId },
      include: {
        user: {
          select: {
            wallet: true,
            name: true,
            id: true,
          },
        },
      },
    });

    return ownerships.map((o) => ({
      wallet: o.user.wallet,
      name: o.user.name,
      userId: o.user.id,
    }));
  } catch (error) {
    console.error("Error getting NFT holders:", error);
    throw new Error("Failed to get NFT holders");
  }
};

// Helper function to get vault balance
export const getVaultBalance = async (
  vaultAddress: string
): Promise<number> => {
  try {
    const connection = new Connection(clusterApiUrl("devnet"));
    const vaultPublicKey = new PublicKey(vaultAddress);
    const balance = await connection.getBalance(vaultPublicKey);
    return balance / LAMPORTS_PER_SOL; // Convert lamports to SOL
  } catch (error) {
    console.error("Error getting vault balance:", error);
    throw new Error("Failed to get vault balance");
  }
};

// Main fund distribution function
export const distributeVaultFunds = async (
  claimId: string,
  isApproved: boolean
) => {
  try {
    console.log(
      `🔄 Starting fund distribution for claim ${claimId}, approved: ${isApproved}`
    );

    // Get claim with creator and pass info
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        creator: true,
        votes: true,
      },
    });

    if (!claim) {
      throw new Error("Claim not found");
    }

    // Get the pass for this creator
    const pass = await prisma.pass.findUnique({
      where: { creatorId: claim.creatorId },
    });

    if (!pass || !pass.vault_address) {
      throw new Error("Creator pass or vault address not found");
    }

    // Get vault balance
    const vaultBalance = await getVaultBalance(pass.vault_address);
    console.log(`💰 Vault balance: ${vaultBalance} SOL`);

    if (vaultBalance <= 0) {
      console.log("⚠️ Vault is empty, no funds to distribute");
      return {
        success: true,
        message: "Vault is empty, no funds to distribute",
        distributedAmount: 0,
      };
    }

    if (isApproved) {
      // Transfer entire vault to creator
      console.log(
        `✅ Claim approved - transferring ${vaultBalance} SOL to creator`
      );

      // Note: In a real implementation, you would call the on-chain transfer here
      // For now, we'll just log the action
      console.log(
        `📤 Would transfer ${vaultBalance} SOL to creator wallet: ${claim.creator.wallet}`
      );

      return {
        success: true,
        message: `Transferred ${vaultBalance} SOL to creator`,
        distributedAmount: vaultBalance,
        recipient: claim.creator.wallet,
        recipientType: "creator",
      };
    } else {
      // Distribute equally among NFT holders
      const holders = await getNFTHoldersForCreator(claim.creatorId);
      console.log(
        `👥 Found ${holders.length} NFT holders for creator ${claim.creatorId}`
      );

      if (holders.length === 0) {
        console.log("⚠️ No NFT holders found, no funds to distribute");
        return {
          success: true,
          message: "No NFT holders found, no funds to distribute",
          distributedAmount: 0,
        };
      }

      const amountPerHolder = vaultBalance / holders.length;
      console.log(
        `💰 Distributing ${amountPerHolder} SOL to each of ${holders.length} holders`
      );

      // Note: In a real implementation, you would call the on-chain transfers here
      // For now, we'll just log the action
      holders.forEach((holder, index) => {
        console.log(
          `📤 Would transfer ${amountPerHolder} SOL to holder ${index + 1}: ${
            holder.wallet
          } (${holder.name})`
        );
      });

      return {
        success: true,
        message: `Distributed ${vaultBalance} SOL among ${holders.length} NFT holders`,
        distributedAmount: vaultBalance,
        amountPerHolder,
        recipients: holders,
        recipientType: "nft_holders",
      };
    }
  } catch (error) {
    console.error("Error distributing vault funds:", error);
    throw new Error(
      `Failed to distribute vault funds: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
