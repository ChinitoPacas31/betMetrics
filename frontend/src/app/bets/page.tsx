"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useBetting } from "@/context/BettingContext";
import { formatMoney, formatOdds } from "@/lib/oddsUtils";
import { BetSettlementStatus } from "@/types";
import {
  IconBolt,
  IconCheck,
  IconClose,
  IconHistory,
  IconTrash,
} from "@/components/Icons";
import TrafficLightBadge from "@/components/TrafficLightBadge";

export default function PaperBetsHistoryPage() {
  const {
    oddsFormat,
    availableBankroll,
    pendingRisk,
    realizedPnL,
    roiPercentage,
    paperBets,
    settlePaperBet,
    deletePaperBet,
  } = useBetting();

  const [statusFilter, setStatusFilter] = useState<
    BetSettlementStatus | "ALL"
  >("ALL");

  const stats = useMemo(() => {
    const won = paperBets.filter((b) => b.status === "WON").length;
    const lost = paperBets.filter((b) => b.status === "LOST").length;
    const decided = won + lost;
    const winRate = decided > 0 ? (won / decided) * 100 : 0;
    const avgEv =
      paperBets.length > 0
        ? paperBets.reduce((acc, b) => acc + b.evPercentage, 0) /
          paperBets.length
        : 0;
    return { won, lost, winRate, avgEv };
  }, [paperBets]);

  const filteredBets = useMemo(() => {
    if (statusFilter === "ALL") return paperBets;
    return paperBets.filter((b) => b.status === statusFilter);
  }, [paperBets, statusFilter]);

  return (
    <div className="space-y-4 pb-10">
      {/* Encabezado y Resumen de Portafolio */}
      <div className="rounded-lg border border-sb-border bg-sb-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-blue-500/35 bg-sb-blue/15 text-blue-400">
              <IconHistory className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white">
                My Paper Bets &amp; Bankroll Performance
              </h1>
              <p className="text-xs text-slate-400">
                Settle your simulated bets as Won, Lost, or Push to audit your realized ROI against theoretical +EV.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="rounded bg-sb-blue px-3.5 py-2 text-xs font-bold text-white transition hover:bg-sb-blue-hover"
          >
            + Find Lines in Sportsbook
          </Link>
        </div>

        {/* KPIs del Portafolio */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded border border-sb-border bg-sb-canvas p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Available Balance
            </span>
            <p className="mt-1 font-mono text-base font-extrabold text-white tabular-nums">
              {formatMoney(availableBankroll)}
            </p>
          </div>
          <div className="rounded border border-sb-border bg-sb-canvas p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Active Risk
            </span>
            <p className="mt-1 font-mono text-base font-bold text-blue-400 tabular-nums">
              {formatMoney(pendingRisk)}
            </p>
          </div>
          <div className="rounded border border-sb-border bg-sb-canvas p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Realized P&amp;L
            </span>
            <p
              className={`mt-1 font-mono text-base font-extrabold tabular-nums ${
                realizedPnL > 0
                  ? "text-emerald-400"
                  : realizedPnL < 0
                  ? "text-rose-400"
                  : "text-slate-200"
              }`}
            >
              {formatMoney(realizedPnL, true)}
            </p>
          </div>
          <div className="rounded border border-sb-border bg-sb-canvas p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Realized ROI
            </span>
            <p
              className={`mt-1 font-mono text-base font-bold tabular-nums ${
                roiPercentage > 0
                  ? "text-emerald-400"
                  : roiPercentage < 0
                  ? "text-rose-400"
                  : "text-slate-200"
              }`}
            >
              {roiPercentage > 0 ? "+" : ""}
              {roiPercentage.toFixed(2)}%
            </p>
          </div>
          <div className="rounded border border-sb-border bg-sb-canvas p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Record (W-L)
            </span>
            <p className="mt-1 font-mono text-base font-bold text-white tabular-nums">
              {stats.won}-{stats.lost}{" "}
              <span className="text-xs font-normal text-slate-400">
                ({stats.winRate.toFixed(0)}%)
              </span>
            </p>
          </div>
          <div className="rounded border border-sb-border bg-sb-canvas p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Average EV%
            </span>
            <p
              className={`mt-1 font-mono text-base font-bold tabular-nums ${
                stats.avgEv > 0 ? "text-emerald-400" : "text-slate-300"
              }`}
            >
              {stats.avgEv > 0 ? "+" : ""}
              {stats.avgEv.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Filtros de Estado */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sb-border bg-sb-panel px-3 py-2">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "ALL", label: `All (${paperBets.length})` },
              {
                id: "PENDING",
                label: `In Play (${
                  paperBets.filter((b) => b.status === "PENDING").length
                })`,
              },
              {
                id: "WON",
                label: `Won (${
                  paperBets.filter((b) => b.status === "WON").length
                })`,
              },
              {
                id: "LOST",
                label: `Lost (${
                  paperBets.filter((b) => b.status === "LOST").length
                })`,
              },
              {
                id: "PUSH",
                label: `Push / Void (${
                  paperBets.filter((b) => b.status === "PUSH").length
                })`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === tab.id
                  ? "bg-sb-blue text-white"
                  : "text-slate-400 hover:bg-sb-surface hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Historial de Boletos */}
      {filteredBets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-sb-border bg-sb-panel px-4 py-14 text-center">
          <IconBolt className="h-8 w-8 text-slate-500" />
          <p className="mt-2.5 text-sm font-bold text-slate-200">
            No Paper Bets in this view yet
          </p>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Select any odds on the main Sportsbook board or in the Calculator to log your first simulated bet.
          </p>
          <Link
            href="/"
            className="mt-4 rounded bg-sb-blue px-4 py-2 text-xs font-bold text-white hover:bg-sb-blue-hover"
          >
            Go to Odds Board
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-sb-border bg-sb-panel">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sb-border bg-sb-header text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-3.5 py-2.5">Event / Selection</th>
                  <th className="px-3 py-2.5">Bookmaker</th>
                  <th className="px-3 py-2.5 text-right">Odds</th>
                  <th className="px-3 py-2.5 text-right">True Prob.</th>
                  <th className="px-3 py-2.5 text-right">Stake</th>
                  <th className="px-3 py-2.5 text-right">Pot. Profit</th>
                  <th className="px-3 py-2.5 text-center">Edge +EV</th>
                  <th className="px-3 py-2.5 text-center">Status / Settle</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sb-border/70">
                {filteredBets.map((bet) => {
                  const dateFormatted = new Date(
                    bet.placedAt
                  ).toLocaleString("en-US", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={bet.id}
                      className="bg-sb-surface transition hover:bg-sb-hover"
                    >
                      <td className="px-3.5 py-3">
                        <p className="font-bold text-white">{bet.selection}</p>
                        <p className="text-[11px] text-slate-400">
                          {bet.matchName} •{" "}
                          <span className="text-slate-500">{bet.league}</span>
                        </p>
                        <p className="font-mono text-[10px] text-slate-500">
                          {dateFormatted}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-slate-300">
                        {bet.bookmaker}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-blue-400 tabular-nums">
                        {formatOdds(bet.decimalOdds, oddsFormat)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-300 tabular-nums">
                        {(bet.trueProbability * 100).toFixed(1)}%
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-white tabular-nums">
                        {formatMoney(bet.stake)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-emerald-400 tabular-nums">
                        +{formatMoney(bet.potentialProfit)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <TrafficLightBadge
                          color={bet.trafficLight}
                          evPercentage={bet.evPercentage}
                          compact
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => settlePaperBet(bet.id, "WON")}
                            title="Mark as Won"
                            className={`flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold uppercase transition ${
                              bet.status === "WON"
                                ? "border-emerald-400 bg-emerald-500 text-slate-950"
                                : "border-sb-border bg-sb-canvas text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400"
                            }`}
                          >
                            <IconCheck className="h-3 w-3" />
                            <span>Won</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => settlePaperBet(bet.id, "LOST")}
                            title="Mark as Lost"
                            className={`flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold uppercase transition ${
                              bet.status === "LOST"
                                ? "border-rose-400 bg-rose-500 text-white"
                                : "border-sb-border bg-sb-canvas text-slate-400 hover:border-rose-500/50 hover:text-rose-400"
                            }`}
                          >
                            <IconClose className="h-3 w-3" />
                            <span>Lost</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => settlePaperBet(bet.id, "PUSH")}
                            title="Mark as Push / Void"
                            className={`rounded border px-2 py-1 text-[10px] font-bold uppercase transition ${
                              bet.status === "PUSH"
                                ? "border-amber-400 bg-amber-500 text-slate-950"
                                : "border-sb-border bg-sb-canvas text-slate-400 hover:border-amber-500/50 hover:text-amber-300"
                            }`}
                          >
                            Push
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => deletePaperBet(bet.id)}
                          title="Delete record"
                          className="rounded p-1.5 text-slate-500 transition hover:bg-rose-500/15 hover:text-rose-400"
                        >
                          <IconTrash className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

