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

  // Status banner configuration
  const getStatusBanner = () => {
    switch (widget.status) {
      case "COMPLETED":
        return {
          text: "🎉 GOAL COMPLETED!",
          bgColor: "bg-green-300",
          borderColor: "border-green-600",
          textColor: "text-green-800",
        };
      case "FAILED":
        return {
          text: "❌ GOAL FAILED",
          bgColor: "bg-red-300",
          borderColor: "border-red-600",
          textColor: "text-red-800",
        };
      case "EXPIRED":
        return {
          text: "⏰ EXPIRED",
          bgColor: "bg-gray-300",
          borderColor: "border-gray-600",
          textColor: "text-gray-800",
        };
      default:
        return null;
    }
  };

  const statusBanner = getStatusBanner();

  return (
    <Card className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000] relative">
      {statusBanner && (
        <div
          className={`absolute -top-2 left-1/2 transform -translate-x-1/2 z-10 ${statusBanner.bgColor} ${statusBanner.borderColor} border-4 px-4 py-1 shadow-[4px_4px_0_0_#000] ${statusBanner.textColor} font-black text-sm rotate-1`}
        >
          {statusBanner.text}
        </div>
      )}

      <CardHeader className="border-b-4 border-black p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-black bg-cyan-300 flex items-center justify-center">
            {widget.creator.image ? (
              <Image
                src={widget.creator.image}
                width={40}
                height={40}
                alt={widget.creator.name || ""}
              />
            ) : (
              <span className="font-black">
                {(widget.creator.name || "?").charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="font-black">{widget.title}</div>
            <div className="text-sm font-bold text-gray-700">Goal • Passes</div>
          </div>
          {widget.expiresAt && widget.status === "ACTIVE" && (
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
            <span>
              {widget.currentValue ?? 0} / {widget.targetValue ?? 0} passes
            </span>
            <span
              className={
                widget.status === "COMPLETED"
                  ? "text-green-600"
                  : widget.status === "FAILED"
                  ? "text-red-600"
                  : ""
              }
            >
              {pct}%
            </span>
          </div>
          <Progress
            value={pct}
            className={
              widget.status === "COMPLETED"
                ? "bg-green-200"
                : widget.status === "FAILED"
                ? "bg-red-200"
                : ""
            }
          />
          {widget.status === "COMPLETED" && (
            <div className="text-center text-sm font-bold text-green-600">
              🎉 Target reached! Great job!
            </div>
          )}
          {widget.status === "FAILED" && (
            <div className="text-center text-sm font-bold text-red-600">
              😔 Goal not reached in time
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
