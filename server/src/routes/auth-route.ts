import { Router } from "express";
import {
  requestNonce,
  verifySignature,
  me,
} from "../controllers/auth-controller";
import { authenticate } from "../middleware/auth-middleware";

const authRouter = Router();

authRouter.post("/request-nonce", requestNonce);
authRouter.post("/verify-signature", verifySignature);
authRouter.get("/me", authenticate, me);

export default authRouter;
