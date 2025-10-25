import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/:passId", async (req, res) => {
  try {
    const { passId } = req.params;

    const pass = await prisma.pass.findUnique({
      where: { id: parseInt(passId) },
      include: { creator: { select: { name: true } } },
    });

    if (!pass) {
      return res.status(404).json({ error: "Pass not found" });
    }

    const metadata = {
      name: pass.name || `${pass.creator.name}'s Creator Pass`,
      description:
        pass.description ||
        "A unique Creator Pass NFT that grants access to exclusive content and benefits.",
      image:
        "https://via.placeholder.com/400x400/6366f1/ffffff?text=Creator+Pass",
      symbol: "PASS",
      attributes: [
        { trait_type: "Type", value: "Creator Pass" },
        { trait_type: "Creator", value: pass.creator.name },
        { trait_type: "Collection", value: "SocialFi Creators" },
        { trait_type: "Token Mint", value: pass.tokenMint },
      ],
    };

    res.json(metadata);
  } catch (error) {
    console.error("Error fetching metadata:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
