import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth-middleware";

export const updateMediaUrl = async (req: AuthRequest, res: Response) => {
  try {
    const { originalKey, playlistPath } = req.body;
    console.log(originalKey);
    console.log(playlistPath);
    console.log(
      await prisma.media.findMany({
        where: {
          url: originalKey,
        },
      })
    );

    if (!originalKey || !playlistPath) {
      return res
        .status(400)
        .json({ error: "Missing originalKey or playlistPath" });
    }

    const result = await prisma.media.updateMany({
      where: { url: originalKey },
      data: { url: playlistPath },
    });

    if (result.count === 0) {
      return res
        .status(404)
        .json({ message: "No media found with the given URL" });
    }

    return res.status(200).json({
      message: "Media URL updated successfully",
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Error updating media URL:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
