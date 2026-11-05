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
                Mis Paper Bets &amp; Rendimiento de Bankroll
              </h1>
              <p className="text-xs text-slate-400">
                Liquida tus apuestas simuladas como Ganadas, Perdidas o Push para auditar tu ROI real frente al +EV teórico.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="rounded bg-sb-blue px-3.5 py-2 text-xs font-bold text-white transition hover:bg-sb-blue-hover"
          >
            + Buscar Líneas en Sportsbook
          </Link>
        </div>

        {/* KPIs del Portafolio */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded border border-sb-border bg-sb-canvas p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Saldo Disponible
            </span>
            <p className="mt-1 font-mono text-base font-extrabold text-white tabular-nums">
              {formatMoney(availableBankroll)}
            </p>
          </div>
          <div className="rounded border border-sb-border bg-sb-canvas p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Riesgo Activo
            </span>
            <p className="mt-1 font-mono text-base font-bold text-blue-400 tabular-nums">
              {formatMoney(pendingRisk)}
            </p>
          </div>
          <div className="rounded border border-sb-border bg-sb-canvas p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              P&amp;L Realizado
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
              ROI Real
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
              Récord (G-P)
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
              EV% Promedio
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
              { id: "ALL", label: `Todas (${paperBets.length})` },
              {
                id: "PENDING",
                label: `En Juego (${
                  paperBets.filter((b) => b.status === "PENDING").length
                })`,
              },
              {
                id: "WON",
                label: `Ganadas (${
                  paperBets.filter((b) => b.status === "WON").length
                })`,
              },
              {
                id: "LOST",
                label: `Perdidas (${
                  paperBets.filter((b) => b.status === "LOST").length
                })`,
              },
              {
                id: "PUSH",
                label: `Push / Nulas (${
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
            Aún no hay Paper Bets en esta vista
          </p>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Selecciona cualquier momio en el tablero principal del Sportsbook o en la Calculadora Pro para registrar tu primera apuesta simulada.
          </p>
          <Link
            href="/"
            className="mt-4 rounded bg-sb-blue px-4 py-2 text-xs font-bold text-white hover:bg-sb-blue-hover"
          >
            Ir al Tablero de Momios
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-sb-border bg-sb-panel">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sb-border bg-sb-header text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-3.5 py-2.5">Evento / Selección</th>
                  <th className="px-3 py-2.5">Casa</th>
                  <th className="px-3 py-2.5 text-right">Momio</th>
                  <th className="px-3 py-2.5 text-right">Prob. Real</th>
                  <th className="px-3 py-2.5 text-right">Stake</th>
                  <th className="px-3 py-2.5 text-right">Ganancia Pot.</th>
                  <th className="px-3 py-2.5 text-center">Edge +EV</th>
                  <th className="px-3 py-2.5 text-center">Estado / Liquidar</th>
                  <th className="px-3 py-2.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sb-border/70">
                {filteredBets.map((bet) => {
                  const dateFormatted = new Date(
                    bet.placedAt
                  ).toLocaleString("es-MX", {
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
                            title="Marcar como Ganada"
                            className={`flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold uppercase transition ${
                              bet.status === "WON"
                                ? "border-emerald-400 bg-emerald-500 text-slate-950"
                                : "border-sb-border bg-sb-canvas text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400"
                            }`}
                          >
                            <IconCheck className="h-3 w-3" />
                            <span>Ganó</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => settlePaperBet(bet.id, "LOST")}
                            title="Marcar como Perdida"
                            className={`flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold uppercase transition ${
                              bet.status === "LOST"
                                ? "border-rose-400 bg-rose-500 text-white"
                                : "border-sb-border bg-sb-canvas text-slate-400 hover:border-rose-500/50 hover:text-rose-400"
                            }`}
                          >
                            <IconClose className="h-3 w-3" />
                            <span>Perdió</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => settlePaperBet(bet.id, "PUSH")}
                            title="Marcar como Push / Empate Nulo"
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
                          title="Eliminar registro"
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

