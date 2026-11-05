"use client";

import React, { useState } from "react";
import { useBetting } from "@/context/BettingContext";
import { formatMoney, formatOdds } from "@/lib/oddsUtils";
import { MarketOutcomeEVItem, MatchOddsEVItem } from "@/types";
import { IconChart, IconChevronDown } from "./Icons";
import TrafficLightBadge from "./TrafficLightBadge";

interface MatchRowProps {
  match: MatchOddsEVItem;
}

export default function MatchRow({ match }: MatchRowProps) {
  const {
    oddsFormat,
    activeSlip,
    selectOutcomeToSlip,
    setMobileSlipOpen,
  } = useBetting();
  const [expanded, setExpanded] = useState(false);

  const kickoff = new Date(match.commence_time);
  const dateLabel = kickoff.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
  const timeLabel = kickoff.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Fallback seguro si el objeto viniera sin arreglo outcomes
  const outcomes: MarketOutcomeEVItem[] =
    match.outcomes && match.outcomes.length > 0
      ? match.outcomes
      : [
          {
            key: "1",
            selection: match.selection,
            bookmaker: match.bookmaker,
            decimal_odds: match.decimal_odds,
            implied_probability: match.implied_probability,
            true_probability: match.true_probability,
            stake: match.stake,
            potential_profit: match.potential_profit,
            expected_value: match.expected_value,
            ev_percentage: match.ev_percentage,
            traffic_light: match.traffic_light,
            recommendation: match.recommendation,
          },
        ];

  const is3Way = outcomes.length === 3;
  const bestEdge = Math.max(...outcomes.map((o) => o.ev_percentage));
  const hasHighValue = bestEdge > 3.0;

  function handleSelectOutcome(outcome: MarketOutcomeEVItem) {
    selectOutcomeToSlip({
      matchId: match.match_id,
      matchName: `${match.home_team} vs ${match.away_team}`,
      league: match.league,
      sportKey: match.sport_key,
      commenceTime: match.commence_time,
      outcomeKey: outcome.key,
      selection: outcome.selection,
      bookmaker: outcome.bookmaker,
      decimalOdds: outcome.decimal_odds,
      consensusProbability: outcome.true_probability,
    });
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setMobileSlipOpen(true);
    }
  }

  return (
    <div className="border-b border-sb-border/80 bg-sb-surface transition hover:bg-sb-hover last:border-b-0">
      {/* Fila Principal estilo Altenar / Playdoit */}
      <div className="flex flex-col gap-2.5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        {/* Bloque Izquierdo: Fecha/Hora + Equipos */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Columna Horario */}
          <div className="w-14 shrink-0 border-r border-sb-border pr-2.5 text-center font-mono leading-tight">
            <div className="text-[11px] font-bold text-slate-200 tabular-nums">
              {timeLabel}
            </div>
            <div className="mt-0.5 text-[10px] uppercase text-slate-500">
              {dateLabel}
            </div>
          </div>

          {/* Equipos apilados */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[13px] font-semibold text-white">
                {match.home_team}
              </span>
              {hasHighValue && (
                <span className="shrink-0 rounded border border-emerald-500/35 bg-emerald-500/12 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400 tabular-nums">
                  +{bestEdge.toFixed(1)}% EV
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2">
              <span className="truncate text-[13px] font-semibold text-slate-200">
                {match.away_team}
              </span>
              <span className="shrink-0 text-[10px] text-slate-500">
                {match.bookmakers_count || 1}{" "}
                {(match.bookmakers_count || 1) === 1 ? "casa" : "casas"}
              </span>
            </div>
          </div>
        </div>

        {/* Bloque Derecho: Celdas de Momios (1 - X - 2 o 1 - 2) + Botón Análisis */}
        <div className="flex items-center gap-1.5 sm:shrink-0">
          <div
            className={`grid flex-1 gap-1.5 sm:flex-initial ${
              is3Way
                ? "grid-cols-3 sm:w-[312px]"
                : "grid-cols-2 sm:w-[312px]"
            }`}
          >
            {outcomes.map((outcome) => {
              const isSelected =
                activeSlip?.matchId === match.match_id &&
                activeSlip?.outcomeKey === outcome.key;

              const topBarColor =
                outcome.traffic_light === "GREEN"
                  ? "bg-emerald-400"
                  : outcome.traffic_light === "YELLOW"
                  ? "bg-amber-400"
                  : "bg-transparent";

              const evTextColor = isSelected
                ? "text-blue-100"
                : outcome.traffic_light === "GREEN"
                ? "text-emerald-400 font-bold"
                : outcome.traffic_light === "YELLOW"
                ? "text-amber-300 font-semibold"
                : "text-slate-500";

              return (
                <button
                  key={outcome.key}
                  type="button"
                  onClick={() => handleSelectOutcome(outcome)}
                  className={`group relative overflow-hidden rounded border px-2 py-1.5 text-left transition ${
                    isSelected
                      ? "border-blue-400 bg-sb-blue text-white shadow-md shadow-blue-950/70"
                      : outcome.traffic_light === "GREEN"
                      ? "border-emerald-500/30 bg-sb-odds hover:border-emerald-400/60 hover:bg-sb-odds-hover"
                      : "border-sb-border-light/70 bg-sb-odds hover:border-blue-500/50 hover:bg-sb-odds-hover"
                  }`}
                >
                  {/* Barra superior indicadora de valor */}
                  {!isSelected && (
                    <span
                      className={`absolute inset-x-0 top-0 h-[2px] ${topBarColor}`}
                    />
                  )}

                  {/* Cabecera micro: Clave (1/X/2) + Mejor Bookmaker */}
                  <div className="flex items-center justify-between gap-1 text-[9px] leading-none">
                    <span
                      className={`font-mono font-bold ${
                        isSelected ? "text-blue-100" : "text-slate-400"
                      }`}
                    >
                      {outcome.key}
                    </span>
                    <span
                      className={`truncate ${
                        isSelected ? "text-blue-100" : "text-slate-400"
                      }`}
                    >
                      {outcome.bookmaker}
                    </span>
                  </div>

                  {/* Momio Principal + %EV */}
                  <div className="mt-1 flex items-baseline justify-between gap-1">
                    <span className="font-mono text-[13px] font-extrabold tracking-tight text-white tabular-nums">
                      {formatOdds(outcome.decimal_odds, oddsFormat)}
                    </span>
                    <span
                      className={`font-mono text-[10px] tabular-nums ${evTextColor}`}
                    >
                      {outcome.ev_percentage > 0 ? "+" : ""}
                      {outcome.ev_percentage.toFixed(1)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Botón Desglose Cuantitativo */}
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            title="Ver desglose matemático +EV"
            className={`flex h-[46px] w-8 shrink-0 items-center justify-center rounded border transition ${
              expanded
                ? "border-blue-500/50 bg-sb-blue/15 text-blue-400"
                : "border-sb-border bg-sb-canvas text-slate-400 hover:border-sb-border-light hover:text-white"
            }`}
          >
            {expanded ? (
              <IconChevronDown className="h-3.5 w-3.5 rotate-180 transition" />
            ) : (
              <IconChart className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Cajón Expandible: Comparativa Cuantitativa de Probabilidades */}
      {expanded && (
        <div className="border-t border-sb-border bg-sb-canvas/90 px-3 py-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="font-bold uppercase tracking-wider text-slate-400">
              Análisis Sin Margen (De-Vigged Consensus) • Stake Base{" "}
              {formatMoney(match.stake)}
            </span>
            <TrafficLightBadge
              color={match.traffic_light}
              evPercentage={match.ev_percentage}
              compact
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sb-border text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="pb-1.5 font-semibold">Selección</th>
                  <th className="pb-1.5 font-semibold">Mejor Casa</th>
                  <th className="pb-1.5 text-right font-semibold">Momio</th>
                  <th className="pb-1.5 text-right font-semibold">
                    Prob. Implícita
                  </th>
                  <th className="pb-1.5 text-right font-semibold">
                    Prob. Real (Fair)
                  </th>
                  <th className="pb-1.5 text-right font-semibold">EV ($)</th>
                  <th className="pb-1.5 text-right font-semibold">Edge %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sb-border/50 font-mono text-[11px] tabular-nums">
                {outcomes.map((o) => (
                  <tr key={o.key} className="hover:bg-sb-panel/70">
                    <td className="py-1.5 font-sans font-semibold text-slate-200">
                      <span className="mr-1.5 rounded bg-sb-odds px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                        {o.key}
                      </span>
                      {o.selection}
                    </td>
                    <td className="py-1.5 font-sans text-slate-400">
                      {o.bookmaker}
                    </td>
                    <td className="py-1.5 text-right font-bold text-white">
                      {formatOdds(o.decimal_odds, oddsFormat)}
                    </td>
                    <td className="py-1.5 text-right text-slate-400">
                      {(o.implied_probability * 100).toFixed(1)}%
                    </td>
                    <td className="py-1.5 text-right font-semibold text-blue-400">
                      {(o.true_probability * 100).toFixed(1)}%
                    </td>
                    <td
                      className={`py-1.5 text-right font-bold ${
                        o.expected_value > 0
                          ? "text-emerald-400"
                          : o.expected_value === 0
                          ? "text-amber-300"
                          : "text-rose-400"
                      }`}
                    >
                      {formatMoney(o.expected_value, true)}
                    </td>
                    <td
                      className={`py-1.5 text-right font-bold ${
                        o.ev_percentage > 3
                          ? "text-emerald-400"
                          : o.ev_percentage >= 0
                          ? "text-amber-300"
                          : "text-rose-400"
                      }`}
                    >
                      {o.ev_percentage > 0 ? "+" : ""}
                      {o.ev_percentage.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">Mejor línea:</span>{" "}
            {match.selection} ({match.bookmaker}) — {match.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}

