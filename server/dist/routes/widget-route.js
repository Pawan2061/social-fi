"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/widget-route.ts
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth-middleware");
const validation_middleware_1 = require("../middleware/validation-middleware");
const widget_poll_schema_1 = require("../zod/widget-poll-schema");
const widget_controller_1 = require("../controllers/widget-controller");
const widgetRouter = (0, express_1.Router)();
widgetRouter.post("/", auth_middleware_1.authenticate, (0, validation_middleware_1.validateData)(widget_poll_schema_1.CreateWidgetSchema), widget_controller_1.createWidget);
widgetRouter.get("/", auth_middleware_1.authenticate, widget_controller_1.getWidgets);
widgetRouter.get("/:widgetId", auth_middleware_1.authenticate, widget_controller_1.getWidget);
widgetRouter.post("/:widgetId/vote", auth_middleware_1.authenticate, (0, validation_middleware_1.validateData)(widget_poll_schema_1.CastPollVoteSchema), widget_controller_1.voteOnPoll);
exports.default = widgetRouter;
