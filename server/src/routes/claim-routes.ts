import { Router } from "express";
import { authenticate } from "../middleware/auth-middleware";
import {
  createClaim,
  getClaim,
  getClaims,
  updateClaim,
  acceptClaim,
} from "../controllers/claim-controller";

const claimRouter = Router();

claimRouter.post("/", authenticate, createClaim);

claimRouter.get("/", authenticate, getClaims);
claimRouter.post("/:claimId/accept", authenticate, acceptClaim);

claimRouter.get("/:id", authenticate, getClaim);

claimRouter.put("/:claimId", authenticate, updateClaim);

export default claimRouter;
