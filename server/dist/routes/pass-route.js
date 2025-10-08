"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/pass-route.ts
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth-middleware");
const pass_controller_1 = require("../controllers/pass-controller");
const validation_middleware_1 = require("../middleware/validation-middleware");
const pass_schema_1 = require("../zod/pass-schema");
const passRouter = (0, express_1.Router)();
passRouter.post("/", auth_middleware_1.authenticate, (0, validation_middleware_1.validateData)(pass_schema_1.createPassSchema), pass_controller_1.createPass);
passRouter.put("/", auth_middleware_1.authenticate, (0, validation_middleware_1.validateData)(pass_schema_1.updatePassSchema), pass_controller_1.updatePass);
passRouter.post("/buy", auth_middleware_1.authenticate, (0, validation_middleware_1.validateData)(pass_schema_1.buyPassSchema), pass_controller_1.buyPass);
passRouter.get("/:creatorId", auth_middleware_1.authenticate, pass_controller_1.getPass);
exports.default = passRouter;
