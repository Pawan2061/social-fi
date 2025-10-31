import { z } from "zod";

export const createPassSchema = z.object({
  tokenMint: z.string().min(1, "tokenMint is required"),
  price: z.number().positive("Price must be a positive number"),
  vault_address: z.string().min(1, "vault_address is required").optional(),
});

export const updatePassSchema = z.object({
  price: z.number().positive("Price must be a positive number"),
});

export const buyPassSchema = z.object({
  passId: z.string().uuid("passId must be a valid UUID"),
  txId: z.string().min(1, "Transaction ID is required"),
});
