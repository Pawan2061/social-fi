import React from "react";

interface BrutalGridProps {
  size?: number; // grid cell size in px
  majorSize?: number; // major grid interval in px
  lineColor?: string; // minor line color
  majorLineColor?: string; // major line color
  className?: string;
}

export const BrutalGrid: React.FC<BrutalGridProps> = ({
  size = 32,
  majorSize = 128,
  lineColor = "rgba(0,0,0,0.1)",
  majorLineColor = "rgba(0,0,0,0.18)",
  className,
}) => {
  const style: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
    backgroundImage: `
      linear-gradient(to right, ${lineColor} 1px, transparent 1px),
      linear-gradient(to bottom, ${lineColor} 1px, transparent 1px),
      linear-gradient(to right, ${majorLineColor} 2px, transparent 2px),
      linear-gradient(to bottom, ${majorLineColor} 2px, transparent 2px)
    `,
    backgroundSize: `${size}px ${size}px, ${size}px ${size}px, ${majorSize}px ${majorSize}px, ${majorSize}px ${majorSize}px`,
    backgroundPosition: "top left, top left, top left, top left",
  };

  return <div className={className} style={style} />;
};

interface NoiseOverlayProps {
  dotSize?: number; // dot spacing in px
  opacity?: number; // 0..1
  className?: string;
}

export const NoiseOverlay: React.FC<NoiseOverlayProps> = ({
  dotSize = 6,
  opacity = 0.06,
  className,
}) => {
  const style: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
    color: `rgba(0,0,0,${opacity})`,
    backgroundImage: "radial-gradient(currentColor 0.7px, transparent 0.7px)",
    backgroundSize: `${dotSize}px ${dotSize}px`,
    mixBlendMode: "multiply",
  };

  return <div className={className} style={style} />;
}; 