import { TrafficLightColor } from "@/types";

interface TrafficLightBadgeProps {
  color: TrafficLightColor;
  evPercentage?: number;
}

const BADGE_CONFIG: Record<
  TrafficLightColor,
  {
    label: string;
    containerClass: string;
    dotClass: string;
  }
> = {
  GREEN: {
    label: "+EV Value Bet",
    containerClass:
      "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950/50",
    dotClass: "bg-emerald-400 animate-pulse",
  },
  YELLOW: {
    label: "Neutral Edge",
    containerClass:
      "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-950/50",
    dotClass: "bg-amber-400",
  },
  RED: {
    label: "High Risk (-EV)",
    containerClass:
      "bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-950/50",
    dotClass: "bg-rose-500",
  },
};

export default function TrafficLightBadge({
  color,
  evPercentage,
}: TrafficLightBadgeProps) {
  const config = BADGE_CONFIG[color] ?? BADGE_CONFIG.RED;
  const formattedPct =
    evPercentage !== undefined
      ? ` (${evPercentage > 0 ? "+" : ""}${evPercentage.toFixed(2)}%)`
      : "";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${config.containerClass}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dotClass}`} />
      <span>
        {config.label}
        {formattedPct}
      </span>
    </span>
  );
}

