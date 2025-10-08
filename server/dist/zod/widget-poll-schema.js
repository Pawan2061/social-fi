"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = exports.CastPollVoteSchema = exports.CreateWidgetSchema = exports.WidgetSchema = exports.PollVoteSchema = exports.PollOptionSchema = exports.WidgetStatus = exports.GoalMetric = exports.WidgetType = void 0;
const zod_1 = require("zod");
exports.WidgetType = zod_1.z.enum(["GOAL", "POLL"]);
exports.GoalMetric = zod_1.z.enum(["PASS_COUNT"]);
exports.WidgetStatus = zod_1.z.enum(["ACTIVE", "COMPLETED", "EXPIRED"]);
exports.PollOptionSchema = zod_1.z.object({
    widgetId: zod_1.z.number().optional(),
    text: zod_1.z.string().min(1, "Option text is required"),
    voteCount: zod_1.z.number().default(0).optional(),
});
exports.PollVoteSchema = zod_1.z.object({
    id: zod_1.z.number().optional(),
    widgetId: zod_1.z.number(),
    optionId: zod_1.z.number(),
    createdAt: zod_1.z.date().optional(),
});
exports.WidgetSchema = zod_1.z.object({
    postId: zod_1.z.number().nullable().optional(),
    type: exports.WidgetType,
    title: zod_1.z.string().min(1, "Widget title is required"),
    description: zod_1.z.string().nullable().optional(),
    targetValue: zod_1.z.number().nullable().optional(),
    metric: exports.GoalMetric.nullable().optional(),
    expiresAt: zod_1.z.coerce.date().nullable().optional(),
    pollOptions: zod_1.z.array(exports.PollOptionSchema).optional(),
});
exports.CreateWidgetSchema = exports.WidgetSchema.pick({
    postId: true,
    type: true,
    title: true,
    description: true,
    targetValue: true,
    metric: true,
    expiresAt: true,
    pollOptions: true,
});
exports.CastPollVoteSchema = zod_1.z.object({
    optionId: zod_1.z.number(),
});
exports.schemas = {
    WidgetType: exports.WidgetType,
    GoalMetric: exports.GoalMetric,
    WidgetStatus: exports.WidgetStatus,
    PollOptionSchema: exports.PollOptionSchema,
    PollVoteSchema: exports.PollVoteSchema,
    WidgetSchema: exports.WidgetSchema,
    CreateWidgetSchema: exports.CreateWidgetSchema,
    CastPollVoteSchema: exports.CastPollVoteSchema,
};
