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
exports.signUpload = exports.deletePost = exports.getFeed = exports.getPost = exports.createPost = void 0;
const prisma_1 = require("../lib/prisma");
const storage_1 = require("../lib/storage");
const image_helper_1 = require("../lib/image-helper");
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        let userId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { caption, isPremium, media } = req.body;
        userId = userId;
        const post = yield prisma_1.prisma.post.create({
            data: {
                creatorId: userId,
                caption: caption || null,
                isPremium: Boolean(isPremium),
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
        res.json(post);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create post" });
    }
});
exports.createPost = createPost;
const getPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const postId = req.params.id;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const post = yield prisma_1.prisma.post.findUnique({
            where: { id: postId },
            include: { media: true, creator: true },
        });
        if (!post)
            return res.status(404).json({ error: "Post not found" });
        let ownsPass = false;
        if (post.isPremium) {
            const ownership = yield prisma_1.prisma.ownership.findFirst({
                where: { userId, creatorId: post.creatorId },
            });
            ownsPass = !!ownership;
        }
        const transformed = yield Promise.all(post.media.map((m) => __awaiter(void 0, void 0, void 0, function* () {
            if (!post.isPremium || ownsPass) {
                return Object.assign(Object.assign({}, m), { url: (0, image_helper_1.resolveMediaUrl)(m.url), locked: false });
            }
            return Object.assign(Object.assign({}, m), { url: null, locked: true });
        })));
        res.json(Object.assign(Object.assign({}, post), { media: transformed }));
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch post" });
    }
});
exports.getPost = getPost;
const getFeed = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
        const limit = parseInt(req.query.limit || "10", 10);
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const ownerships = yield prisma_1.prisma.ownership.findMany({
            where: { userId },
            select: { creatorId: true },
        });
        const ownedCreatorIds = ownerships.map((o) => o.creatorId);
        const posts = yield prisma_1.prisma.post.findMany({
            where: {
                creatorId: {
                    not: userId,
                },
            },
            take: limit + 1,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { createdAt: "desc" },
            include: { media: true, creator: true },
        });
        const hasMore = posts.length > limit;
        const items = yield Promise.all(posts.slice(0, limit).map((post) => __awaiter(void 0, void 0, void 0, function* () {
            const ownsPass = ownedCreatorIds.includes(post.creatorId);
            const creator = Object.assign(Object.assign({}, post.creator), { image: (0, image_helper_1.resolveMediaUrl)(post.creator.image) });
            const media = yield Promise.all(post.media.map((m) => __awaiter(void 0, void 0, void 0, function* () {
                if (!post.isPremium || ownsPass) {
                    return Object.assign(Object.assign({}, m), { url: (0, image_helper_1.resolveMediaUrl)(m.url), locked: false });
                }
                return Object.assign(Object.assign({}, m), { url: null, locked: true });
            })));
            return Object.assign(Object.assign({}, post), { media, creator });
        })));
        res.json({ items, nextCursor: hasMore ? posts[limit].id : null });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch feed" });
    }
});
exports.getFeed = getFeed;
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const postId = req.params.id;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const post = yield prisma_1.prisma.post.findUnique({ where: { id: postId } });
        if (!post || post.creatorId !== userId) {
            return res.status(403).json({ error: "Not allowed" });
        }
        yield prisma_1.prisma.post.delete({ where: { id: postId } });
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete post" });
    }
});
exports.deletePost = deletePost;
const signUpload = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fileName, fileType } = req.body;
        const { uploadUrl, key } = yield (0, storage_1.getSignedUploadUrl)(fileName, fileType);
        res.json({ uploadUrl, key });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to get signed upload url" });
    }
});
exports.signUpload = signUpload;
