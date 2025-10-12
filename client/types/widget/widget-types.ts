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