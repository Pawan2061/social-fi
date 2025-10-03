import { z } from "zod";

export const addVoteSchema = z.object({
  approve: z.boolean(),
  txSig: z.string().nonempty("Transaction signature is required"),
  blockSlot: z.number().optional(),
});
