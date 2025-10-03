import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth-middleware";

export const getVoteCounts = async (req: AuthRequest, res: Response) => {
  try {
    const { claimId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const claim = await prisma.claim.findUnique({
      where: { id: Number(claimId) },
    });

    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    const [yesVotes, noVotes, userVote] = await Promise.all([
      prisma.vote.count({
        where: { claimId: Number(claimId), approve: true },
      }),
      prisma.vote.count({
        where: { claimId: Number(claimId), approve: false },
      }),
      prisma.vote.findUnique({
        where: {
          claimId_userId: {
            claimId: Number(claimId),
            userId,
          },
        },
      }),
    ]);

    res.status(200).json({
      yesVotes,
      noVotes,
      userVote: userVote ? { approve: userVote.approve } : null,
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
};

export const addVote = async (req: AuthRequest, res: Response) => {
  try {
    const { claimId } = req.params;
    const { approve, txSig, blockSlot } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const claim = await prisma.claim.findUnique({
      where: {
        id: Number(claimId),
      },
    });
    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }
    const existingVote = await prisma.vote.findUnique({
      where: {
        claimId_userId: {
          claimId: Number(claimId),
          userId,
        },
      },
    });

    if (existingVote) {
      return res.status(400).json({
        error: "You have already voted on this claim. Votes cannot be changed.",
      });
    }
    const vote = await prisma.vote.create({
      data: {
        claimId: Number(claimId),
        userId: userId,
        txSig,
        approve,
        blockSlot,
      },
    });
    res.status(200).json(vote);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};
