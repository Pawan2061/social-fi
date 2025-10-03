import { Request, Response } from "express";
import { getSignedUploadUrl, PUBLIC_BUCKET_URL } from "../lib/storage";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth-middleware";

export const signProfilePictureUpload = async (req: AuthRequest, res: Response) => {
  try {
    const { fileName, fileType } = req.body;
    const { uploadUrl, key } = await getSignedUploadUrl(fileName, fileType);
    res.json({ uploadUrl, key });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

