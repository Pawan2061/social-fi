"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const media_controller_1 = require("../controllers/media-controller");
const mediaRouter = (0, express_1.Router)();
mediaRouter.post("/transcoded", media_controller_1.updateMediaUrl);
exports.default = mediaRouter;
