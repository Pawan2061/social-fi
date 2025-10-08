"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptClaimSchema = exports.updateClaimSchema = exports.createClaimSchema = exports.mediaSchema = void 0;
const zod_1 = require("zod");
exports.mediaSchema = zod_1.z.object({
    type: zod_1.z.string().min(1, "Media type is required"),
    url: zod_1.z.string().min(1, "Media URL is required"),
    thumbnail: zod_1.z.string().nullable().optional(),
});
exports.createClaimSchema = zod_1.z.object({
    reason: zod_1.z.string().min(3, "Reason must be at least 3 characters"),
    amount: zod_1.z.number().positive("Amount must be positive"),
    validTill: zod_1.z.iso.datetime().optional(),
    media: zod_1.z.array(exports.mediaSchema).optional(),
});
exports.updateClaimSchema = zod_1.z.object({
    reason: zod_1.z.string().min(3).optional(),
    amount: zod_1.z.number().positive().optional(),
    media: zod_1.z.array(exports.mediaSchema).optional(),
});
exports.acceptClaimSchema = zod_1.z.object({
    txid: zod_1.z.string().min(1, "Transaction ID is required"),
});
