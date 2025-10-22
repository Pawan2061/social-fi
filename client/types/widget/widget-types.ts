export interface IWidgetForm {
    title: string;
    description: string;
    type: "GOAL" | "POLL";
    targetValue?: number;
    metric?: "PASS_COUNT";
    expiresAt?: string;
    pollOptions?: { pollOptions: IPollOption }[];
}

interface IPollOption {
    text: string;
}

// Feed widget item returned by server for listing
export type WidgetType = 'GOAL' | 'POLL'

export interface WidgetCreator {
    id: number;
    name: string | null;
    image: string | null;
}

export interface WidgetPollOption {
    id: number;
    text: string;
    _count: { PollVote: number };
}

export interface BaseWidgetItem {
    id: number;
    type: WidgetType;
    title: string;
    description: string | null;
    createdAt: string;
    expiresAt?: string | null;
    status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
    creator: WidgetCreator;
}

export interface GoalWidgetItem extends BaseWidgetItem {
    type: 'GOAL';
    targetValue?: number;
    metric?: 'PASS_COUNT';
    currentValue?: number;
    progress?: number; // 0-100
}

export interface PollWidgetItem extends BaseWidgetItem {
    type: 'POLL';
    pollOptions: WidgetPollOption[];
    hasVoted?: boolean;
    votedOptionId?: number | null;
}

export type WidgetListItem = GoalWidgetItem | PollWidgetItem;