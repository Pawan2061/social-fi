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
const storage_1 = require("../lib/storage");
const createPass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { tokenMint, price, vault_address } = req.body;
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
            data: { creatorId, tokenMint, price, vault_address },
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
            where: { creatorId: Number(creatorId) },
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
            image: `${storage_1.PUBLIC_BUCKET_URL}/${pass.creator.image}` });
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
        const { passId, txId } = req.body;
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
        let success = true;
        // success= here check the transaction of on chain  usng txid and assign value of success accordingly
        if (success) {
            yield prisma_1.prisma.ownership.create({
                data: {
                    userId,
                    creatorId: pass.creatorId,
                    passId,
                },
            });
            res.status(200).json({ message: "Pass bought successfully" });
        }
        else {
            res.status(400).json({ error: "Transaction failed" });
        }
    }
    catch (e) {
        res.status(500).json({
            message: e.message,
        });
    }
});
exports.buyPass = buyPass;
