"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { Progress } from "./progress-bar";
import type { GoalWidgetItem } from "@/types/widget/widget-types";

interface Props {
    widget: GoalWidgetItem;
}

export default function GoalWidgetCard({ widget }: Props) {
    const pct = Math.max(0, Math.min(100, widget.progress ?? 0));

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
                        <div className="text-sm font-bold text-gray-700">Goal • Passes</div>
                    </div>
                    {widget.expiresAt && (
                        <div className="text-xs font-bold bg-yellow-300 border-2 border-black px-2 py-1 rotate-1">
                            Ends {new Date(widget.expiresAt).toLocaleDateString()}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                {widget.description && (
                    <p className="font-bold text-sm">{widget.description}</p>
                )}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-extrabold">
                        <span>{widget.currentValue ?? 0} / {widget.targetValue ?? 0} passes</span>
                        <span>{pct}%</span>
                    </div>
                    <Progress value={pct} />
                </div>
            </CardContent>
        </Card>
    );
}
