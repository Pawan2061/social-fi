import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth-middleware";
import { getSignedUrlForMedia } from "../lib/storage";

export const createClaim = async (req: AuthRequest, res: Response) => {
  try {
    const { reason, amount, media, validTill } = req.body;
    const creatorId = req.user?.userId;
    if (!creatorId) return res.status(401).json({ error: "Unauthorized" });

    const claim = await prisma.claim.create({
      data: {
        creatorId,
        reason,
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
      where: { id: Number(id) },
      include: {
        media: true,
        creator: true,
      },
    });

    if (!claim) return res.status(404).json({ error: "Claim not found" });

    const media = await Promise.all(
      claim.media.map(async (m) => ({
        ...m,
        url: await getSignedUrlForMedia(m.url),
      }))
    );

    res.status(200).json({
      ...claim,
      media,
      creator: {
        ...claim.creator,
        image: claim.creator.image
          ? await getSignedUrlForMedia(claim.creator.image)
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
    const ownerships = await prisma.ownership.findMany({
      where: { userId },
      select: { creatorId: true },
    });
    const creatorIds = ownerships.map((o) => o.creatorId);

    const claims = await prisma.claim.findMany({
      where: { creatorId: { in: creatorIds } },
      include: { media: true, creator: true },
    });

    const transformed = await Promise.all(
      claims.map(async (claim) => {
        const media = await Promise.all(
          claim.media.map(async (m) => ({
            ...m,
            url: await getSignedUrlForMedia(m.url),
          }))
        );

        return {
          ...claim,
          media,
          creator: {
            ...claim.creator,
            image: claim.creator.image
              ? await getSignedUrlForMedia(claim.creator.image)
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
      where: { id: Number(claimId) },
    });

    if (!existingClaim || existingClaim.creatorId !== userId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.media.deleteMany({
        where: { claimId: Number(claimId) },
      });

      return tx.claim.update({
        where: { id: Number(claimId) },
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

export const acceptClaim = async (req: AuthRequest, res: Response) => {
  try {
    const { claimId } = req.params;
    const { txid } = req.body;
    const creatorId = req.user?.userId;
    if (!creatorId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const claim = await prisma.claim.findUnique({
      where: { id: Number(claimId) },
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
