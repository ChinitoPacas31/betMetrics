import { TrafficLightColor } from "@/types";

interface TrafficLightBadgeProps {
  color: TrafficLightColor;
  evPercentage?: number;
  compact?: boolean;
}

const BADGE_CONFIG: Record<
  TrafficLightColor,
  {
    label: string;
    shortLabel: string;
    containerClass: string;
    dotClass: string;
  }
> = {
  GREEN: {
    label: "VALOR +EV",
    shortLabel: "+EV",
    containerClass:
      "bg-emerald-500/12 text-emerald-400 border-emerald-500/35",
    dotClass: "bg-emerald-400",
  },
  YELLOW: {
    label: "NEUTRAL",
    shortLabel: "NEUTRAL",
    containerClass:
      "bg-amber-500/12 text-amber-300 border-amber-500/35",
    dotClass: "bg-amber-400",
  },
  RED: {
    label: "EV NEGATIVO",
    shortLabel: "-EV",
    containerClass:
      "bg-rose-500/10 text-rose-400 border-rose-500/30",
    dotClass: "bg-rose-500",
  },
};

export default function TrafficLightBadge({
  color,
  evPercentage,
  compact = false,
}: TrafficLightBadgeProps) {
  const config = BADGE_CONFIG[color] ?? BADGE_CONFIG.RED;
  const formattedPct =
    evPercentage !== undefined
      ? `${evPercentage > 0 ? "+" : ""}${evPercentage.toFixed(2)}%`
      : "";

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-tight tabular-nums ${config.containerClass}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
        <span>{formattedPct || config.shortLabel}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase ${config.containerClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      <span>{config.label}</span>
      {formattedPct && (
        <span className="font-mono tabular-nums opacity-95">
          ({formattedPct})
        </span>
      )}
    </span>
  );
}
