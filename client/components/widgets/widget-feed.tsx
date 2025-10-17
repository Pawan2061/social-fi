"use client";
import { useFetchWidgets } from "@/hooks/use-fetch-widgets";
import type { WidgetListItem } from "@/types/widget/widget-types";
import GoalWidgetCard from "@/components/widgets/goal-widget-card";
import PollWidgetCard from "@/components/widgets/poll-widget-card";
import type { PollWidgetItem } from "@/types/widget/widget-types";
import { Button } from "@/components/ui/button";

type WidgetFeedProps = {
    items?: WidgetListItem[]; // optional mock data
};

export default function WidgetFeed({ items }: WidgetFeedProps) {
    const useMock = Array.isArray(items) && items.length > 0;

    // If items are provided, don't fetch from the API
    const { data, isLoading, error, refetch } = useFetchWidgets({ enabled: !useMock });

    if (!useMock && isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-6 transform rotate-1">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mx-auto mb-4"></div>
                    <p className="font-extrabold text-xl">Loading widgets...</p>
                </div>
            </div>
        );
    }

    if (!useMock && error) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <div className="bg-red-50 border-4 border-red-500 shadow-[6px_6px_0_0_#ef4444] p-6 transform rotate-1 text-center">
                    <h3 className="font-extrabold text-xl mb-2 text-red-700">Error Loading Widgets</h3>
                    <p className="text-red-600 font-bold mb-4">
                        {error instanceof Error ? error.message : "Failed to load widgets"}
                    </p>
                    <Button
                        onClick={() => refetch()}
                        className="bg-red-500 text-white border-4 border-red-700 shadow-[4px_4px_0_0_#b91c1c] hover:shadow-[6px_6px_0_0_#b91c1c] hover:-translate-x-1 hover:-translate-y-1 font-extrabold"
                    >
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    // Normalize fetched data
    const widgets: WidgetListItem[] = useMock
        ? (items as WidgetListItem[])
        : Array.isArray(data)
            ? data
            : Array.isArray(data?.widgets)
                ? data.widgets
                : [];

    if (!widgets.length) {
        return (
            <div className="text-center py-12">
                <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-8 transform rotate-1 inline-block">
                    <h3 className="font-extrabold text-xl mb-2">No Widgets Available</h3>
                    <p className="text-gray-600 font-bold max-w-md">
                        {data?.message
                            ? data.message
                            : "You don't have access to any widgets yet. Buy a pass to unlock creators' goals and polls."}
                    </p>
                </div>
            </div>
        );
    }

    const handleVote = async (widgetId: number, optionId: number) => {
        if (useMock) {
            console.log("Mock vote:", { widgetId, optionId });
            return;
        }
        try {
            const token = localStorage.getItem("authToken");
            if (!token) throw new Error("No authentication token found");

            const res = await fetch(`http://localhost:4000/api/widgets/${widgetId}/vote`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ optionId })
            });
            if (!res.ok) throw new Error(await res.text());
            // Refresh to reflect updated counts and vote state
            refetch();
        } catch (e) {
            console.error(e);
            // Optional: add toast
        }
    };

    return (
        <div className="space-y-6">
            {widgets.map((w, index) => (
                <div
                    key={w.id}
                    className={`transform ${index % 2 === 0 ? "rotate-1" : "-rotate-1"} hover:rotate-0 transition-transform`}
                >
                    {w.type === 'GOAL' ? (
                        <GoalWidgetCard widget={w} />
                    ) : (
                        <PollWidgetCard widget={w as PollWidgetItem} onVote={handleVote} />
                    )}
                </div>
            ))}
        </div>
    );
}