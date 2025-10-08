"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardUserSchema = exports.updateMyProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateMyProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").optional(),
    image: zod_1.z.string().min(1, "Image key is required").optional(),
});
exports.onboardUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    email: zod_1.z.email("Invalid email"),
    image: zod_1.z.string().optional(),
});
