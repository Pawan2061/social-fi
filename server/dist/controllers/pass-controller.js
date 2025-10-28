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
exports.buyPass = exports.updatePass = exports.getPass = exports.createPass = void 0;
const prisma_1 = require("../lib/prisma");
const image_helper_1 = require("../lib/image-helper");
const createPass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { tokenMint, price, vault_address, metadataUri, name, description } = req.body;
        const creatorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        console.log(creatorId);
        if (!creatorId)
            return res.status(401).json({ error: "Unauthorized" });
        const existingPass = yield prisma_1.prisma.pass.findUnique({
            where: { creatorId },
        });
        if (existingPass) {
            return res.status(400).json({ error: "Creator already owns a pass" });
        }
        const pass = yield prisma_1.prisma.pass.create({
            data: {
                creatorId,
                tokenMint,
                price,
                vault_address,
                metadataUri,
                name,
                description,
            },
        });
        res.status(200).json(pass);
    }
    catch (e) {
        res.status(500).json({
            message: e.message,
        });
    }
});
exports.createPass = createPass;
const getPass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { creatorId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const pass = yield prisma_1.prisma.pass.findUnique({
            where: { creatorId: creatorId },
            include: {
                creator: true,
            },
        });
        if (!pass) {
            return res.status(404).json({ message: "Creator doesn't own a pass" });
        }
        const ownership = yield prisma_1.prisma.ownership.findUnique({
            where: {
                userId_passId: {
                    userId,
                    passId: pass.id,
                },
            },
        });
        const creatorWithImage = Object.assign(Object.assign({}, pass.creator), { 
            // image: pass.creator.image
            //   ? await getSignedUrlForMedia(pass.creator.image)
            //   : null,
            image: (0, image_helper_1.resolveMediaUrl)(pass.creator.image) });
        res.status(200).json(Object.assign(Object.assign({}, pass), { creator: creatorWithImage, owned: !!ownership }));
    }
    catch (e) {
        res.status(500).json({
            message: e.message,
        });
    }
});
exports.getPass = getPass;
const updatePass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { price } = req.body;
    const creatorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!creatorId)
        return res.status(401).json({ error: "Unauthorized" });
    try {
        const initialPass = yield prisma_1.prisma.pass.findUnique({
            where: { creatorId },
            include: {
                creator: true,
            },
        });
        if (!initialPass) {
            return res.status(404).json({ error: "Pass not found" });
        }
        if (initialPass.creatorId !== creatorId) {
            return res.status(403).json({
                message: "You are not authorized to perform this action. Only the creator of this pass can do it.",
            });
        }
        const pass = yield prisma_1.prisma.pass.update({
            where: { creatorId },
            data: { price },
        });
        res.status(200).json(pass);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
exports.updatePass = updatePass;
const buyPass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { passId, txId, nftMint } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const pass = yield prisma_1.prisma.pass.findUnique({
            where: { id: passId },
            include: {
                creator: true,
            },
        });
        if (!pass) {
            return res.status(404).json({ error: "Pass not found" });
        }
        // For now, we'll trust the frontend transaction and create the ownership record
        // In production, you might want to add transaction verification
        console.log("📝 Creating ownership record for transaction:", txId);
        // Create ownership record
        yield prisma_1.prisma.ownership.create({
            data: {
                userId,
                creatorId: pass.creatorId,
                passId,
                nftMint,
            },
        });
        // Log the purchase for analytics
        console.log("📊 Pass purchase completed:", {
            userId,
            passId,
            creatorId: pass.creatorId,
            price: pass.price,
            txId,
            nftMint,
            vaultAddress: pass.vault_address,
        });
        // Update widget progress for PASS_COUNT goals
        try {
            const activeWidgets = yield prisma_1.prisma.widget.findMany({
                where: {
                    creatorId: pass.creatorId,
                    type: "GOAL",
                    metric: "PASS_COUNT",
                    status: "ACTIVE",
                },
            });
            // Update currentValue for each active widget
            for (const widget of activeWidgets) {
                const newCount = yield prisma_1.prisma.ownership.count({
                    where: {
                        creatorId: pass.creatorId,
                        createdAt: { gte: widget.createdAt },
                    },
                });
                yield prisma_1.prisma.widget.update({
                    where: { id: widget.id },
                    data: { currentValue: newCount },
                });
                // Check if goal is completed
                if (widget.targetValue && newCount >= widget.targetValue) {
                    yield prisma_1.prisma.widget.update({
                        where: { id: widget.id },
                        data: { status: "COMPLETED" },
                    });
                }
            }
        }
        catch (widgetError) {
            console.error("Error updating widget progress:", widgetError);
            // Don't fail the pass purchase if widget update fails
        }
        res.status(200).json({
            message: "Pass bought successfully",
            nftMint,
            txId,
        });
    }
    catch (e) {
        console.error("Buy pass error:", e);
        res.status(500).json({
            message: e.message,
        });
    }
});
exports.buyPass = buyPass;
