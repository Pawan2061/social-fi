import { Router } from "express";
import { authenticate } from "../middleware/auth-middleware";
import { getVoteCounts, addVote } from "../controllers/vote-controller";
import { addVoteSchema } from "../zod/vote-schema";
import { validateData } from "../middleware/validation-middleware";

const voteRouter = Router();

voteRouter.get("/:claimId", authenticate, getVoteCounts);

voteRouter.post(
  "/:claimId",
  authenticate,
  validateData(addVoteSchema),
  addVote
);

export default voteRouter;
