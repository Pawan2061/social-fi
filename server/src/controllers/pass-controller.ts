import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth-middleware";
import { resolveMediaUrl } from "../lib/image-helper";

export const createPass = async (req: AuthRequest, res: Response) => {
  try {
    const { tokenMint, price, vault_address } = req.body;
    const creatorId = req.user?.userId;
    console.log(creatorId);
    if (!creatorId) return res.status(401).json({ error: "Unauthorized" });
    const existingPass = await prisma.pass.findUnique({
      where: { creatorId },
    });

    if (existingPass) {
      return res.status(400).json({ error: "Creator already owns a pass" });
    }

    const pass = await prisma.pass.create({
      data: { creatorId, tokenMint, price, vault_address },
    });
    res.status(200).json(pass);
  } catch (e: any) {
    res.status(500).json({
      message: e.message,
    });
  }
};

export const getPass = async (req: AuthRequest, res: Response) => {
  try {
    const { creatorId } = req.params;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const pass = await prisma.pass.findUnique({
      where: { creatorId: Number(creatorId) },
      include: {
        creator: true,
      },
    });
    if (!pass) {
      return res.status(404).json({ message: "Creator doesn't own a pass" });
    }
    const ownership = await prisma.ownership.findUnique({
      where: {
        userId_passId: {
          userId,
          passId: pass.id,
        },
      },
    });
    const creatorWithImage = {
      ...pass.creator,
      // image: pass.creator.image
      //   ? await getSignedUrlForMedia(pass.creator.image)
      //   : null,
      image: resolveMediaUrl(pass.creator.image),
    };

    res.status(200).json({
      ...pass,
      creator: creatorWithImage,
      owned: !!ownership,
    });
  } catch (e: any) {
    res.status(500).json({
      message: e.message,
    });
  }
};
export const updatePass = async (req: AuthRequest, res: Response) => {
  const { price } = req.body;
  const creatorId = req.user?.userId;
  if (!creatorId) return res.status(401).json({ error: "Unauthorized" });
  try {
    const initialPass = await prisma.pass.findUnique({
      where: { creatorId },
      include: {
        creator: true,
      },
    });
    if (!initialPass) {
      return res.status(404).json({ error: "Pass not found" });
    }
    if (initialPass.creatorId !== creatorId) {
      return res.status(403).json({
        message:
          "You are not authorized to perform this action. Only the creator of this pass can do it.",
      });
    }
    const pass = await prisma.pass.update({
      where: { creatorId },
      data: { price },
    });

    res.status(200).json(pass);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const buyPass = async (req: AuthRequest, res: Response) => {
  try {
    const { passId, txId } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const pass = await prisma.pass.findUnique({
      where: { id: passId },
      include: {
        creator: true,
      },
    });
    if (!pass) {
      return res.status(404).json({ error: "Pass not found" });
    }
    let success = true;
    // success= here check the transaction of on chain  usng txid and assign value of success accordingly
    if (success) {
      await prisma.ownership.create({
        data: {
          userId,
          creatorId: pass.creatorId,
          passId,
        },
      });
      res.status(200).json({ message: "Pass bought successfully" });
    } else {
      res.status(400).json({ error: "Transaction failed" });
    }
  } catch (e: any) {
    res.status(500).json({
      message: e.message,
    });
  }
};
