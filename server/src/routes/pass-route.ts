import { Router } from "express";

import { authenticate } from "../middleware/auth-middleware";
import {
  buyPass,
  createPass,
  getPass,
  updatePass,
} from "../controllers/pass-controller";

const passRouter = Router();

passRouter.post("/", authenticate, createPass);
passRouter.post("/buy", authenticate, buyPass);

passRouter.get("/:creatorId", authenticate, getPass);

passRouter.put("/", authenticate, updatePass);

export default passRouter;
