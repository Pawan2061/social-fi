"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signUploadSchema = exports.createPostSchema = exports.mediaSchema = void 0;
const zod_1 = require("zod");
exports.mediaSchema = zod_1.z.object({
    type: zod_1.z.string().min(1, "Media type is required"),
    url: zod_1.z.string().min(1, "Media URL is required"),
    thumbnail: zod_1.z.string().optional(),
});
exports.createPostSchema = zod_1.z.object({
    caption: zod_1.z.string().optional(),
    isPremium: zod_1.z.boolean().optional(),
    media: zod_1.z.array(exports.mediaSchema).optional(),
});
exports.signUploadSchema = zod_1.z.object({
    fileName: zod_1.z.string().min(1, "File name is required"),
    fileType: zod_1.z.string().min(1, "File type is required"),
});
