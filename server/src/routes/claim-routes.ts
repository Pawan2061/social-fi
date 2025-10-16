import { Router } from "express";
import { authenticate } from "../middleware/auth-middleware";
import {
  createClaim,
  getClaim,
  getClaims,
  updateClaim,
  acceptClaim,
  voteOnClaim,
  finalizeClaim,
  finalizeClaimWithDistribution,
  payoutClaim,
  refundClaim,
} from "../controllers/claim-controller";
import { validateData } from "../middleware/validation-middleware";
import {
  createClaimSchema,
  acceptClaimSchema,
  updateClaimSchema,
} from "../zod/claim-schema";

const claimRouter = Router();

claimRouter.post(
  "/",
  authenticate,
  validateData(createClaimSchema),
  createClaim
);

claimRouter.get("/", authenticate, getClaims);

claimRouter.post(
  "/:claimId/accept",
  authenticate,
  validateData(acceptClaimSchema),
  acceptClaim
);

claimRouter.get("/:id", authenticate, getClaim);

claimRouter.put(
  "/:claimId",
  authenticate,
  validateData(updateClaimSchema),
  updateClaim
);

claimRouter.post("/:claimId/vote", authenticate, voteOnClaim);

claimRouter.post("/:claimId/finalize", authenticate, finalizeClaim);

claimRouter.post(
  "/:claimId/finalize-with-distribution",
  authenticate,
  finalizeClaimWithDistribution
);

claimRouter.post("/:claimId/payout", authenticate, payoutClaim);

claimRouter.post("/:claimId/refund", authenticate, refundClaim);

export default claimRouter;
