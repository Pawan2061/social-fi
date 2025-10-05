// src/routes/widget-route.ts
import { Router } from "express";
import { authenticate } from "../middleware/auth-middleware";
import { validateData } from "../middleware/validation-middleware";
import {
  CastPollVoteSchema,
  CreateWidgetSchema,
} from "../zod/widget-poll-schema";
import {
  createWidget,
  getWidget,
  getWidgets,
  voteOnPoll,
} from "../controllers/widget-controller";

const widgetRouter = Router();

widgetRouter.post(
  "/",
  authenticate,
  validateData(CreateWidgetSchema),
  createWidget
);

widgetRouter.get("/", authenticate, getWidgets);
widgetRouter.get("/:widgetId", authenticate, getWidget);

widgetRouter.post(
  "/:widgetId/vote",
  authenticate,
  validateData(CastPollVoteSchema),
  voteOnPoll
);

export default widgetRouter;
