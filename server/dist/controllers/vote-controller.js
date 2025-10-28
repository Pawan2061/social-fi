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
exports.addVote = exports.getVoteCounts = void 0;
const prisma_1 = require("../lib/prisma");
const getVoteCounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { claimId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const claim = yield prisma_1.prisma.claim.findUnique({
            where: { id: claimId },
        });
        if (!claim) {
            return res.status(404).json({ error: "Claim not found" });
        }
        const [yesVotes, noVotes, userVote] = yield Promise.all([
            prisma_1.prisma.vote.count({
                where: { claimId: claimId, approve: true },
            }),
            prisma_1.prisma.vote.count({
                where: { claimId: claimId, approve: false },
            }),
            prisma_1.prisma.vote.findUnique({
                where: {
                    claimId_userId: {
                        claimId: claimId,
                        userId,
                    },
                },
            }),
        ]);
        res.status(200).json({
            yesVotes,
            noVotes,
            userVote: userVote ? { approve: userVote.approve } : null,
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ message: e.message });
    }
});
exports.getVoteCounts = getVoteCounts;
const addVote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { claimId } = req.params;
        const { approve, txSig, blockSlot } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        console.log("🗳️ Vote request received:", {
            claimId,
            userId,
            body: req.body,
            approve,
            txSig,
            blockSlot,
        });
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const claim = yield prisma_1.prisma.claim.findUnique({
            where: {
                id: claimId,
            },
        });
        if (!claim) {
            return res.status(404).json({ error: "Claim not found" });
        }
        const existingVote = yield prisma_1.prisma.vote.findUnique({
            where: {
                claimId_userId: {
                    claimId: claimId,
                    userId,
                },
            },
        });
        if (existingVote) {
            return res.status(400).json({
                error: "You have already voted on this claim. Votes cannot be changed.",
            });
        }
        const vote = yield prisma_1.prisma.vote.create({
            data: {
                claimId: claimId,
                userId: userId,
                txSig,
                approve,
                blockSlot,
            },
        });
        res.status(200).json(vote);
    }
    catch (e) {
        console.error("❌ Error in addVote:", e);
        res.status(500).json({ message: e.message });
    }
});
exports.addVote = addVote;
