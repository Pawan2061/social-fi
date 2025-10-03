import { z } from "zod";

export const updateMyProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  image: z.string().min(1, "Image key is required").optional(),
});

export const onboardUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email"),
  image: z.string().optional(),
});
