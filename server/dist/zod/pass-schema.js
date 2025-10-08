"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyPassSchema = exports.updatePassSchema = exports.createPassSchema = void 0;
const zod_1 = require("zod");
exports.createPassSchema = zod_1.z.object({
    tokenMint: zod_1.z.string().min(1, "tokenMint is required"),
    price: zod_1.z.number().positive("Price must be a positive number"),
    vault_address: zod_1.z.string().min(1, "vault_address is required").optional(),
});
exports.updatePassSchema = zod_1.z.object({
    price: zod_1.z.number().positive("Price must be a positive number"),
});
exports.buyPassSchema = zod_1.z.object({
    passId: zod_1.z.number().int().positive("passId must be a valid integer"),
    txId: zod_1.z.string().min(1, "Transaction ID is required"),
});
