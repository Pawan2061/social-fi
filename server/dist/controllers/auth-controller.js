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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.verifySignature = exports.requestNonce = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const bs58_1 = __importDefault(require("bs58"));
const prisma_1 = require("../lib/prisma");
const image_helper_1 = require("../lib/image-helper");
const JWT_SECRET = process.env.JWT_SECRET;
const requestNonce = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { address } = req.body;
    const nonce = crypto_1.default.randomBytes(16).toString("hex");
    yield prisma_1.prisma.user.upsert({
        where: { wallet: address },
        update: { nonce },
        create: { wallet: address, nonce },
    });
    res.json({ nonce });
});
exports.requestNonce = requestNonce;
const verifySignature = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { address, signature } = req.body;
    console.log(address, signature);
    const user = yield prisma_1.prisma.user.findUnique({ where: { wallet: address } });
    if (!user || !user.nonce)
        return res.status(401).send("Unauthorized");
    const message = new TextEncoder().encode(user.nonce);
    const sigBytes = bs58_1.default.decode(signature);
    const pubKeyBytes = bs58_1.default.decode(address);
    const valid = tweetnacl_1.default.sign.detached.verify(message, sigBytes, pubKeyBytes);
    if (!valid)
        return res.status(401).send("Invalid signature");
    yield prisma_1.prisma.user.update({
        where: { wallet: address },
        data: { nonce: null },
    });
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
});
exports.verifySignature = verifySignature;
const me = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            return res.status(401).send("Unauthorized");
        const user = yield prisma_1.prisma.user.findUnique({
            where: {
                id: req.user.userId,
            },
            include: { pass: true },
        });
        if (!user)
            return res.status(404).json({ error: "User not found" });
        const userWithImage = Object.assign(Object.assign({}, user), { image: user.image ? (0, image_helper_1.resolveMediaUrl)(user.image) : null });
        res.json(userWithImage);
    }
    catch (e) {
        console.error("Error in me:", e);
        res.status(500).json({ message: e.message });
    }
});
exports.me = me;
