import CreateNewWidget from "@/components/widgets/create-new-widget";
import WidgetFeed from "@/components/widgets/widget-feed";
import type { WidgetListItem } from "@/types/widget/widget-types";

const mockWidgets: WidgetListItem[] = [
    {
        id: 101,
        type: "GOAL",
        title: "Reach 100 Passes in October",
        description:
            "Help me hit 100 passes to unlock a behind-the-scenes stream!",
        metric: "PASS_COUNT",
        targetValue: 100,
        currentValue: 42,
        expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        creator: { id: 1, name: "Alice", image: "" },
        post: null,
        pollOptions: [
            { id: 1, text: "Solana account compression", _count: { PollVote: 12 } },
            { id: 2, text: "Anchor CPI deep dive", _count: { PollVote: 8 } },
            { id: 3, text: "NFT metadata best practices", _count: { PollVote: 5 } },
        ],
        userVotedOptionId: null,
    } as any,
    {
        id: 303,
        type: "GOAL",
        title: "Hit 250 Passes to launch course",
        description: "At 250 passes, I’ll drop a free mini-course for holders.",
        metric: "PASS_COUNT",
        targetValue: 250,
        currentValue: 175,
        expiresAt: null,
        creator: { id: 3, name: "Carol", image: "" },
        post: null,
    } as any,
];

export default function Test() {
    return (
        <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
            <h1 className="text-3xl font-black transform rotate-1 inline-block bg-yellow-300 border-4 border-black px-6 py-2 shadow-[8px_8px_0_0_#000]">
                Mock Widget Feed
            </h1>
            <CreateNewWidget />
            <WidgetFeed items={mockWidgets} />
        </div>
    );
}
