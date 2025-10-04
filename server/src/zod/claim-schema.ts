import { z } from "zod";

export const mediaSchema = z.object({
  type: z.string().min(1, "Media type is required"),
  url: z.string().min(1, "Media URL is required"),
  thumbnail: z.string().nullable().optional(),
});

export const createClaimSchema = z.object({
  reason: z.string().min(3, "Reason must be at least 3 characters"),
  amount: z.number().positive("Amount must be positive"),
  validTill: z.iso.datetime().optional(),
  media: z.array(mediaSchema).optional(),
});

export const updateClaimSchema = z.object({
  reason: z.string().min(3).optional(),
  amount: z.number().positive().optional(),
  media: z.array(mediaSchema).optional(),
});

export const acceptClaimSchema = z.object({
  txid: z.string().min(1, "Transaction ID is required"),
});
