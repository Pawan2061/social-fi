import { z } from "zod";

export const WidgetType = z.enum(["GOAL", "POLL"]);
export const GoalMetric = z.enum(["PASS_COUNT"]);
export const WidgetStatus = z.enum(["ACTIVE", "COMPLETED", "EXPIRED"]);

export const PollOptionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
});

export const PollVoteSchema = z.object({
  id: z.number().optional(),
  widgetId: z.number(),
  optionId: z.number(),
  createdAt: z.date().optional(),
});

export const WidgetSchema = z.object({
  postId: z.string().nullable().optional(),
  type: WidgetType,
  title: z.string().min(1, "Widget title is required"),
  description: z.string().nullable().optional(),
  targetValue: z.number().nullable().optional(),
  metric: GoalMetric.nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  pollOptions: z.array(PollOptionSchema).optional(),
});

export const CreateWidgetSchema = WidgetSchema.pick({
  postId: true,
  type: true,
  title: true,
  description: true,
  targetValue: true,
  metric: true,
  expiresAt: true,
  pollOptions: true,
});

export const CastPollVoteSchema = z.object({
  optionId: z.number(),
});

export const schemas = {
  WidgetType,
  GoalMetric,
  WidgetStatus,
  PollOptionSchema,
  PollVoteSchema,
  WidgetSchema,
  CreateWidgetSchema,
  CastPollVoteSchema,
};

export type WidgetTypeEnum = z.infer<typeof WidgetType>;
export type GoalMetricEnum = z.infer<typeof GoalMetric>;
export type WidgetStatusEnum = z.infer<typeof WidgetStatus>;

export type PollOption = z.infer<typeof PollOptionSchema>;
export type PollVote = z.infer<typeof PollVoteSchema>;
export type Widget = z.infer<typeof WidgetSchema>;
export type CreateWidgetInput = z.infer<typeof CreateWidgetSchema>;
export type CastPollVoteInput = z.infer<typeof CastPollVoteSchema>;
