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
exports.acceptClaim = exports.updateClaim = exports.getClaims = exports.getClaim = exports.createClaim = void 0;
const prisma_1 = require("../lib/prisma");
const storage_1 = require("../lib/storage");
const createClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { reason, amount, media, validTill } = req.body;
        const creatorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!creatorId)
            return res.status(401).json({ error: "Unauthorized" });
        const claim = yield prisma_1.prisma.claim.create({
            data: {
                creatorId,
                reason,
                amount,
                validTill: validTill
                    ? new Date(validTill)
                    : new Date(Date.now() + 24 * 60 * 60 * 1000),
                media: {
                    create: (media || []).map((m) => ({
                        type: m.type,
                        url: m.url,
                        thumbnail: m.thumbnail,
                        needsSignedUrl: true,
                    })),
                },
            },
            include: { media: true },
        });
        res.status(200).json(claim);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
exports.createClaim = createClaim;
const getClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const claim = yield prisma_1.prisma.claim.findUnique({
            where: { id: Number(id) },
            include: {
                media: true,
                creator: true,
            },
        });
        if (!claim)
            return res.status(404).json({ error: "Claim not found" });
        const media = yield Promise.all(claim.media.map((m) => __awaiter(void 0, void 0, void 0, function* () {
            return (Object.assign(Object.assign({}, m), { url: yield (0, storage_1.getSignedUrlForMedia)(m.url) }));
        })));
        res.status(200).json(Object.assign(Object.assign({}, claim), { media, creator: Object.assign(Object.assign({}, claim.creator), { image: claim.creator.image
                    ? yield (0, storage_1.getSignedUrlForMedia)(claim.creator.image)
                    : null }) }));
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
exports.getClaim = getClaim;
const getClaims = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const ownerships = yield prisma_1.prisma.ownership.findMany({
            where: { userId },
            select: { creatorId: true },
        });
        const creatorIds = ownerships.map((o) => o.creatorId);
        const claims = yield prisma_1.prisma.claim.findMany({
            where: { creatorId: { in: creatorIds } },
            include: { media: true, creator: true },
        });
        const transformed = yield Promise.all(claims.map((claim) => __awaiter(void 0, void 0, void 0, function* () {
            const media = yield Promise.all(claim.media.map((m) => __awaiter(void 0, void 0, void 0, function* () {
                return (Object.assign(Object.assign({}, m), { url: yield (0, storage_1.getSignedUrlForMedia)(m.url) }));
            })));
            return Object.assign(Object.assign({}, claim), { media, creator: Object.assign(Object.assign({}, claim.creator), { image: claim.creator.image
                        ? yield (0, storage_1.getSignedUrlForMedia)(claim.creator.image)
                        : null }) });
        })));
        res.status(200).json(transformed);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
exports.getClaims = getClaims;
const updateClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { claimId } = req.params;
        const { reason, amount, media } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const existingClaim = yield prisma_1.prisma.claim.findUnique({
            where: { id: Number(claimId) },
        });
        if (!existingClaim || existingClaim.creatorId !== userId) {
            return res.status(403).json({ error: "Not allowed" });
        }
        const updated = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.media.deleteMany({
                where: { claimId: Number(claimId) },
            });
            return tx.claim.update({
                where: { id: Number(claimId) },
                data: {
                    reason: reason !== null && reason !== void 0 ? reason : existingClaim.reason,
                    amount: amount !== null && amount !== void 0 ? amount : existingClaim.amount,
                    media: {
                        create: (media || []).map((m) => ({
                            type: m.type,
                            url: m.url,
                            thumbnail: m.thumbnail,
                            needsSignedUrl: true,
                        })),
                    },
                },
                include: { media: true },
            });
        }));
        res.status(200).json(updated);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ message: e.message });
    }
});
exports.updateClaim = updateClaim;
const acceptClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { claimId } = req.params;
        const { txid } = req.body;
        const creatorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!creatorId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const claim = yield prisma_1.prisma.claim.findUnique({
            where: { id: Number(claimId) },
            include: { votes: true },
        });
        if (!claim) {
            return res.status(404).json({ error: "Claim not found" });
        }
        const yesVotes = claim.votes.filter((v) => v.approve).length;
        const noVotes = claim.votes.filter((v) => !v.approve).length;
        const status = yesVotes > noVotes ? "APPROVED" : "REJECTED";
        let success = true;
        //  ya pani txid le verify vote
        if (success) {
            const updated = yield prisma_1.prisma.claim.update({
                where: { id: claim.id },
                data: { status },
            });
            res.json({
                message: `Claim ${status.toLowerCase()}`,
                claim: updated,
                yesVotes,
                noVotes,
            });
        }
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
exports.acceptClaim = acceptClaim;
