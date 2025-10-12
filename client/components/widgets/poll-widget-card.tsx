"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import type { PollWidgetItem, WidgetPollOption } from "@/types/widget/widget-types";

interface Props {
    widget: PollWidgetItem;
    onVote: (widgetId: number, optionId: number) => void;
    isVoting?: boolean;
}

export default function PollWidgetCard({ widget, onVote, isVoting }: Props) {
    const totalVotes = widget.pollOptions.reduce((acc, o) => acc + (o._count?.PollVote ?? 0), 0);

    const votedId = widget.votedOptionId ?? null;
    const disabled = widget.hasVoted || !!votedId || isVoting;

    const pct = (o: WidgetPollOption) => {
        const count = o._count?.PollVote ?? 0;
        if (totalVotes === 0) return 0;
        return Math.round((count / totalVotes) * 100);
    };

    return (
        <Card className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000]">
            <CardHeader className="border-b-4 border-black p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-black bg-cyan-300 flex items-center justify-center">
                        {widget.creator.image ? (
                            <Image src={widget.creator.image} width={40} height={40} alt={widget.creator.name || ""} />
                        ) : (
                            <span className="font-black">{(widget.creator.name || "?").charAt(0)}</span>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="font-black">{widget.title}</div>
                        <div className="text-sm font-bold text-gray-700">Poll</div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                {widget.description && (
                    <p className="font-bold text-sm">{widget.description}</p>
                )}
                <div className="space-y-2">
                    {widget.pollOptions.map((opt) => {
                        const percentage = pct(opt);
                        const isVoted = votedId === opt.id;
                        return (
                            <button
                                key={opt.id}
                                disabled={disabled}
                                onClick={() => onVote(widget.id, opt.id)}
                                className={`w-full text-left border-2 border-black p-3 font-extrabold shadow-[3px_3px_0_0_#000] transition-all ${isVoted ? 'bg-yellow-300' : 'bg-white hover:bg-gray-50'
                                    } ${disabled ? 'opacity-80 cursor-not-allowed' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{opt.text}</span>
                                    <span className="text-sm">{percentage}% ({opt._count?.PollVote ?? 0})</span>
                                </div>
                                <div className="mt-2 h-2 bg-gray-200 border-2 border-black">
                                    <div className="h-full bg-blue-400" style={{ width: `${percentage}%` }} />
                                </div>
                            </button>
                        );
                    })}
                    <div className="text-xs font-bold text-gray-700">Total votes: {totalVotes}</div>
                </div>
            </CardContent>
        </Card>
    );
}
