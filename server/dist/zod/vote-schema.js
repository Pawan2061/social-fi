"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addVoteSchema = void 0;
const zod_1 = require("zod");
exports.addVoteSchema = zod_1.z.object({
    approve: zod_1.z.boolean(),
    txSig: zod_1.z.string().nonempty("Transaction signature is required"),
    blockSlot: zod_1.z.number().optional(),
});
