// src/routes/pass-route.ts
import { Router } from "express";
import { authenticate } from "../middleware/auth-middleware";
import {
  buyPass,
  createPass,
  getPass,
  updatePass,
} from "../controllers/pass-controller";
import { validateData } from "../middleware/validation-middleware";
import { createPassSchema, updatePassSchema, buyPassSchema } from "../zod/pass-schema";


const passRouter = Router();

passRouter.post("/", authenticate, validateData(createPassSchema), createPass);

passRouter.put("/", authenticate, validateData(updatePassSchema), updatePass);

passRouter.post("/buy", authenticate, validateData(buyPassSchema), buyPass);

passRouter.get("/:creatorId", authenticate, getPass);

export default passRouter;
