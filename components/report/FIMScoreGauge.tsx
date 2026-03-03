"use client";

import { cn } from "@/lib/utils/cn";

interface FIMScoreGaugeProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
}

function getScoreColor(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  if (score >= 25) return "text-orange-600";
  return "text-red-600";
}

function getScoreLabel(score: number): string {
  if (score >= 75) return "Óptima";
  if (score >= 50) return "Moderada";
  if (score >= 25) return "Baja";
  return "Crítica";
}

function getScoreBg(score: number): string {
  if (score >= 75) return "bg-green-50 border-green-200";
  if (score >= 50) return "bg-yellow-50 border-yellow-200";
  if (score >= 25) return "bg-orange-50 border-orange-200";
  return "bg-red-50 border-red-200";
}

export default function FIMScoreGauge({
  score,
  label,
  size = "md",
}: FIMScoreGaugeProps) {
  const radius = size === "lg" ? 54 : size === "md" ? 40 : 28;
  const strokeWidth = size === "lg" ? 8 : size === "md" ? 6 : 5;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const svgSize = (radius + strokeWidth) * 2 + 4;

  const textSize =
    size === "lg"
      ? "text-3xl"
      : size === "md"
      ? "text-2xl"
      : "text-lg";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl border",
        getScoreBg(score)
      )}
    >
      <div className="relative flex items-center justify-center">
        <svg
          width={svgSize}
          height={svgSize}
          className="-rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          {/* Progress circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className={cn("transition-all duration-1000", getScoreColor(score))}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", textSize, getScoreColor(score))}>
            {score}
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className={cn("text-sm font-semibold", getScoreColor(score))}>
          {getScoreLabel(score)}
        </p>
      </div>
    </div>
  );
}
