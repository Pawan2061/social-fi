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
exports.voteOnPoll = exports.getWidget = exports.getWidgets = exports.createWidget = void 0;
const prisma_1 = require("../lib/prisma");
const storage_1 = require("../lib/storage");
const createWidget = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const body = req.body;
        const { postId, type, title, description, targetValue, metric, expiresAt, pollOptions, } = body;
        const creatorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!creatorId)
            return res.status(401).json({ error: "Unauthorized" });
        if (postId) {
            const post = yield prisma_1.prisma.post.findUnique({
                where: { id: postId },
                select: { creatorId: true },
            });
            if (!post)
                return res.status(404).json({ error: "Post not found" });
            if (post.creatorId !== creatorId)
                return res
                    .status(403)
                    .json({ error: "You cannot link another user's post" });
        }
        let currentValue = null;
        if (type === "GOAL" && metric === "PASS_COUNT") {
            currentValue = yield prisma_1.prisma.ownership.count({
                where: { creatorId },
            });
        }
        const widget = yield prisma_1.prisma.widget.create({
            data: {
                creatorId,
                postId,
                type,
                title,
                description,
                targetValue,
                currentValue,
                metric,
                expiresAt,
                pollOptions: type === "POLL" && (pollOptions === null || pollOptions === void 0 ? void 0 : pollOptions.length)
                    ? {
                        create: pollOptions.map((p) => ({
                            text: p.text,
                        })),
                    }
                    : undefined,
            },
            include: {
                pollOptions: {
                    select: {
                        text: true,
                        id: true,
                        _count: { select: { PollVote: true } },
                    },
                },
            },
        });
        return res.status(200).json(widget);
    }
    catch (e) {
        console.error("Error creating widget:", e);
        res.status(500).json({ message: e.message });
    }
});
exports.createWidget = createWidget;
const getWidgets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const ownerships = yield prisma_1.prisma.ownership.findMany({
            where: { userId },
            select: { creatorId: true },
        });
        const creatorIds = ownerships.map((o) => o.creatorId);
        if (creatorIds.length === 0)
            return res.status(200).json([]);
        const widgets = yield prisma_1.prisma.widget.findMany({
            where: { creatorId: { in: creatorIds } },
            include: {
                pollOptions: {
                    select: {
                        id: true,
                        text: true,
                        _count: { select: { PollVote: true } },
                    },
                },
                creator: {
                    select: { id: true, name: true, image: true },
                },
                post: true,
            },
            orderBy: { createdAt: "desc" },
        });
        const creatorPassCounts = yield prisma_1.prisma.ownership.groupBy({
            by: ["creatorId"],
            _count: true,
            where: { creatorId: { in: creatorIds } },
        });
        const passCountMap = Object.fromEntries(creatorPassCounts.map((c) => [c.creatorId, c._count]));
        const userVotes = yield prisma_1.prisma.pollVote.findMany({
            where: { userId },
            select: { widgetId: true, optionId: true },
        });
        const voteMap = new Map(userVotes.map((v) => [v.widgetId, v.optionId]));
        const widgetsWithDetails = widgets.map((w) => {
            const isGoal = w.type === "GOAL";
            const isPoll = w.type === "POLL";
            let currentValue = w.currentValue;
            if (isGoal && w.metric === "PASS_COUNT") {
                currentValue = passCountMap[w.creatorId] || 0;
            }
            const progress = isGoal && w.targetValue
                ? Math.min((currentValue / w.targetValue) * 100, 100)
                : null;
            return {
                id: w.id,
                type: w.type,
                title: w.title,
                description: w.description,
                createdAt: w.createdAt,
                expiresAt: w.expiresAt,
                targetValue: isGoal ? w.targetValue : undefined,
                metric: isGoal ? w.metric : undefined,
                currentValue: isGoal ? currentValue : undefined,
                progress: isGoal ? Math.round(progress !== null && progress !== void 0 ? progress : 0) : undefined,
                pollOptions: isPoll ? w.pollOptions : undefined,
                hasVoted: isPoll ? voteMap.has(w.id) : undefined,
                votedOptionId: isPoll ? voteMap.get(w.id) || null : undefined,
                creator: {
                    id: w.creator.id,
                    name: w.creator.name,
                    image: w.creator.image
                        ? `${storage_1.PUBLIC_BUCKET_URL}/${w.creator.image}`
                        : null,
                },
            };
        });
        return res.status(200).json(widgetsWithDetails);
    }
    catch (e) {
        console.error("Error fetching widgets:", e);
        res.status(500).json({ message: e.message });
    }
});
exports.getWidgets = getWidgets;
const getWidget = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { widgetId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const id = parseInt(widgetId, 10);
        if (isNaN(id))
            return res.status(400).json({ error: "Invalid widget ID" });
        const widget = yield prisma_1.prisma.widget.findUnique({
            where: { id },
            include: {
                pollOptions: {
                    select: {
                        id: true,
                        text: true,
                        _count: { select: { PollVote: true } },
                    },
                },
                creator: {
                    select: { id: true, name: true, image: true },
                },
                post: true,
            },
        });
        if (!widget)
            return res.status(404).json({ error: "Widget not found" });
        const isOwner = widget.creatorId === userId;
        const hasOwnership = yield prisma_1.prisma.ownership.findFirst({
            where: { userId, creatorId: widget.creatorId },
        });
        if (!isOwner && !hasOwnership)
            return res.status(403).json({ error: "Access denied" });
        const existingVote = yield prisma_1.prisma.pollVote.findFirst({
            where: { widgetId: id, userId },
            select: { optionId: true },
        });
        const hasVoted = !!existingVote;
        const votedOptionId = (existingVote === null || existingVote === void 0 ? void 0 : existingVote.optionId) || null;
        let currentValue = widget.currentValue;
        let progress = null;
        if (widget.type === "GOAL" && widget.metric === "PASS_COUNT") {
            currentValue = yield prisma_1.prisma.ownership.count({
                where: { creatorId: widget.creatorId },
            });
            progress = widget.targetValue
                ? Math.min((currentValue / widget.targetValue) * 100, 100)
                : null;
        }
        const widgetWithImage = Object.assign(Object.assign({}, widget), { currentValue, progress: progress ? Math.round(progress) : 0, hasVoted: widget.type === "POLL" ? hasVoted : undefined, votedOptionId: widget.type === "POLL" ? votedOptionId : undefined, creator: Object.assign(Object.assign({}, widget.creator), { image: widget.creator.image
                    ? `${storage_1.PUBLIC_BUCKET_URL}/${widget.creator.image}`
                    : null }) });
        return res.status(200).json(widgetWithImage);
    }
    catch (e) {
        console.error("Error fetching widget:", e);
        return res.status(500).json({ message: e.message });
    }
});
exports.getWidget = getWidget;
const voteOnPoll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { widgetId } = req.params;
        const { optionId } = req.body;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        if (!optionId)
            return res.status(400).json({ error: "Missing optionId" });
        const id = parseInt(widgetId, 10);
        if (isNaN(id))
            return res.status(400).json({ error: "Invalid widget ID" });
        const widget = yield prisma_1.prisma.widget.findUnique({
            where: { id },
            include: { creator: true },
        });
        if (!widget)
            return res.status(404).json({ error: "Widget not found" });
        if (widget.type !== "POLL")
            return res.status(400).json({ error: "This widget is not a poll" });
        const isOwner = widget.creatorId === userId;
        const hasOwnership = yield prisma_1.prisma.ownership.findFirst({
            where: { userId, creatorId: widget.creatorId },
        });
        if (!isOwner && !hasOwnership)
            return res.status(403).json({ error: "Access denied" });
        const existingVote = yield prisma_1.prisma.pollVote.findFirst({
            where: { widgetId: id, userId },
        });
        if (existingVote)
            return res.status(400).json({ error: "You already voted on this poll" });
        const option = yield prisma_1.prisma.pollOption.findFirst({
            where: { id: optionId, widgetId: id },
        });
        if (!option)
            return res
                .status(400)
                .json({ error: "Option does not belong to this widget" });
        yield prisma_1.prisma.pollVote.create({
            data: {
                widgetId: id,
                optionId,
                userId,
            },
        });
        const updatedPoll = yield prisma_1.prisma.widget.findUnique({
            where: { id },
            select: {
                id: true,
                type: true,
                title: true,
                description: true,
                pollOptions: {
                    select: {
                        id: true,
                        text: true,
                        _count: { select: { PollVote: true } },
                    },
                },
            },
        });
        return res.status(200).json({
            message: "Vote recorded successfully",
            poll: Object.assign(Object.assign({}, updatedPoll), { hasVoted: true, votedOptionId: optionId }),
        });
    }
    catch (e) {
        console.error("Error voting on poll:", e);
        res.status(500).json({ message: e.message });
    }
});
exports.voteOnPoll = voteOnPoll;
