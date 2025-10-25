"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
router.get("/:passId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { passId } = req.params;
        const pass = yield prisma_1.prisma.pass.findUnique({
            where: { id: parseInt(passId) },
            include: { creator: { select: { name: true } } },
        });
        if (!pass) {
            return res.status(404).json({ error: "Pass not found" });
        }
        const metadata = {
            name: pass.name || `${pass.creator.name}'s Creator Pass`,
            description: pass.description ||
                "A unique Creator Pass NFT that grants access to exclusive content and benefits.",
            image: "https://via.placeholder.com/400x400/6366f1/ffffff?text=Creator+Pass",
            symbol: "PASS",
            attributes: [
                { trait_type: "Type", value: "Creator Pass" },
                { trait_type: "Creator", value: pass.creator.name },
                { trait_type: "Collection", value: "SocialFi Creators" },
                { trait_type: "Token Mint", value: pass.tokenMint },
            ],
        };
        res.json(metadata);
    }
    catch (error) {
        console.error("Error fetching metadata:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
exports.default = router;
