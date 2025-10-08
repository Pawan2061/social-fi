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
exports.onboardUser = exports.updateMyProfile = exports.getUserProfile = exports.getMyProfile = void 0;
const prisma_1 = require("../lib/prisma");
const storage_1 = require("../lib/storage");
const getMyProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                pass: true,
                posts: { include: { media: true } },
                passes: { include: { pass: true } },
                Widget: true,
            },
        });
        if (!user)
            return res.status(404).json({ error: "User not found" });
        const posts = yield Promise.all(user.posts.map((post) => __awaiter(void 0, void 0, void 0, function* () {
            const media = yield Promise.all(post.media.map((m) => __awaiter(void 0, void 0, void 0, function* () {
                return (Object.assign(Object.assign({}, m), { 
                    // url:
                    //   m.needsSignedUrl
                    //   ? await getSignedUrlForMedia(m.url)
                    //   :
                    //   `${PUBLIC_BUCKET_URL}/${m.url}`,
                    url: m.url ? `${storage_1.PUBLIC_BUCKET_URL}/${m.url}` : null, locked: false }));
            })));
            return Object.assign(Object.assign({}, post), { media });
        })));
        res.status(200).json(Object.assign(Object.assign({}, user), { 
            // image: user.image ? await getSignedUrlForMedia(user.image) : null,
            image: user.image ? `${storage_1.PUBLIC_BUCKET_URL}/${user.image}` : null, posts }));
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ message: e.message });
    }
});
exports.getMyProfile = getMyProfile;
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: Number(id) },
            include: {
                pass: true,
                posts: { include: { media: true } },
                Widget: true,
            },
        });
        if (!user)
            return res.status(404).json({ error: "User not found" });
        const ownership = yield prisma_1.prisma.ownership.findFirst({
            where: { userId, creatorId: user.id },
        });
        const ownsPass = !!ownership;
        const posts = yield Promise.all(user.posts.map((post) => __awaiter(void 0, void 0, void 0, function* () {
            const media = yield Promise.all(post.media.map((m) => __awaiter(void 0, void 0, void 0, function* () {
                if (!post.isPremium || ownsPass) {
                    return Object.assign(Object.assign({}, m), { 
                        // url: m.needsSignedUrl
                        //   ? await getSignedUrlForMedia(m.url)
                        //   : `${PUBLIC_BUCKET_URL}/${m.url}`,
                        url: m.url ? `${storage_1.PUBLIC_BUCKET_URL}/${m.url}` : null, locked: false });
                }
                return Object.assign(Object.assign({}, m), { url: null, locked: true, widget: ownsPass ? user.Widget : null });
            })));
            return Object.assign(Object.assign({}, post), { media });
        })));
        res.status(200).json(Object.assign(Object.assign({}, user), { 
            // image: user.image ? await getSignedUrlForMedia(user.image) : null,
            image: user.image ? `${storage_1.PUBLIC_BUCKET_URL}/${user.image}` : null, posts,
            ownsPass }));
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ message: e.message });
    }
});
exports.getUserProfile = getUserProfile;
const updateMyProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const { name, image } = req.body;
        const updated = yield prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                name,
                image,
                updatedAt: new Date(),
            },
        });
        res.status(200).json(Object.assign(Object.assign({}, updated), { 
            // image: updated.image ? await getSignedUrlForMedia(updated.image) : null,
            // image: user.image ? await getSignedUrlForMedia(user.image) : null,
            image: updated.image ? `${storage_1.PUBLIC_BUCKET_URL}/${updated.image}` : null }));
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ message: e.message });
    }
});
exports.updateMyProfile = updateMyProfile;
const onboardUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const { name, email, image } = req.body;
        const user = yield prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ error: "User not found" });
        if (user.onboarded) {
            return res.status(400).json({ error: "User is already onboarded" });
        }
        const updatedUser = yield prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                name,
                email,
                image,
                onboarded: true,
                updatedAt: new Date(),
            },
        });
        res.status(200).json(Object.assign(Object.assign({}, updatedUser), { 
            // image: updatedUser.image
            //   ? await getSignedUrlForMedia(updatedUser.image)
            //   : null,
            // image: user.image ? await getSignedUrlForMedia(user.image) : null,
            image: updatedUser.image
                ? `${storage_1.PUBLIC_BUCKET_URL}/${updatedUser.image}`
                : null }));
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ message: e.message });
    }
});
exports.onboardUser = onboardUser;
