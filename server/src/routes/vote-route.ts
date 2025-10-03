import { Router } from "express";
import { authenticate } from "../middleware/auth-middleware";
import { getVoteCounts, addVote } from "../controllers/vote-controller";

const voteRouter = Router();

voteRouter.get("/:claimId", authenticate, getVoteCounts);

voteRouter.post("/:claimId", authenticate, addVote);

export default voteRouter;
