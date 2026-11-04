import { MatchOddsEVItem } from "@/types";
import TrafficLightBadge from "./TrafficLightBadge";

interface MatchCardProps {
  match: MatchOddsEVItem;
}

export default function MatchCard({ match }: MatchCardProps) {
  const evSign = match.expected_value > 0 ? "+" : "";
  const formattedDate = new Date(match.commence_time).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/75 p-5 shadow-lg transition hover:border-slate-700">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
            {match.league} • {match.bookmaker}
          </span>
          <TrafficLightBadge
            color={match.traffic_light}
            evPercentage={match.ev_percentage}
          />
        </div>

        <h3 className="text-lg font-bold text-white">
          {match.home_team}{" "}
          <span className="font-normal text-slate-400">vs</span>{" "}
          {match.away_team}
        </h3>
        <p className="mt-0.5 text-xs text-slate-400">{formattedDate}</p>

        <div className="mt-4 rounded-lg border border-slate-800/90 bg-slate-950/70 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Selección Analizada:</span>
            <span className="font-semibold text-white">{match.selection}</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-2 text-center">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">
                Cuota
              </p>
              <p className="mt-0.5 text-base font-bold text-white">
                {match.decimal_odds.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">
                Prob. Implícita
              </p>
              <p className="mt-0.5 text-base font-semibold text-slate-300">
                {(match.implied_probability * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">
                Prob. Real
              </p>
              <p className="mt-0.5 text-base font-semibold text-emerald-400">
                {(match.true_probability * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-800 pt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Paper Stake (${match.stake.toFixed(0)}):
          </span>
          <span
            className={`font-bold ${
              match.expected_value > 0
                ? "text-emerald-400"
                : match.expected_value === 0
                ? "text-amber-300"
                : "text-rose-400"
            }`}
          >
            EV: {evSign}${match.expected_value.toFixed(2)} USD
          </span>
        </div>
        <p className="mt-1.5 text-xs text-slate-400">{match.recommendation}</p>
      </div>
    </article>
  );
}

