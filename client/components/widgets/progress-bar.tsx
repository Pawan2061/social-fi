"use client";
interface ProgressProps {
  value: number; // 0-100
  className?: string;
}

export function Progress({ value, className }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full h-4 border-2 border-black bg-white shadow-[2px_2px_0_0_#000]">
      <div
        className={`h-full bg-green-400 border-r-2 border-black ${
          className || ""
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
