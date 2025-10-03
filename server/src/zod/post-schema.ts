import { z } from "zod";

export const mediaSchema = z.object({
  type: z.string().min(1, "Media type is required"),
  url: z.string().min(1, "Media URL is required"),
  thumbnail: z.string().optional(),
});

export const createPostSchema = z.object({
  caption: z.string().optional(),
  isPremium: z.boolean().optional(),
  media: z.array(mediaSchema).optional(),
});

export const signUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
});
