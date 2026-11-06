"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useBetting } from "@/context/BettingContext";
import { ApiClientError, calculateCustomEV } from "@/lib/api";
import {
  computeEVAndKelly,
  formatMoney,
  formatOdds,
} from "@/lib/oddsUtils";
import {
  IconBolt,
  IconCheck,
  IconClose,
  IconTicket,
  IconTrash,
} from "./Icons";
import TrafficLightBadge from "./TrafficLightBadge";

type SlipTab = "TICKET" | "QUICK_CALC";

export default function BetSlipSidebar() {
  const {
    oddsFormat,
    availableBankroll,
    activeSlip,
    clearSlip,
    mobileSlipOpen,
    setMobileSlipOpen,
    paperBets,
    placePaperBet,
  } = useBetting();

  const [tab, setTab] = useState<SlipTab>("TICKET");

  // Estado del Boleto Activo
  const [stakeStr, setStakeStr] = useState<string>("");
  const [probPercentStr, setProbPercentStr] = useState<string>("");
  const [placing, setPlacing] = useState<boolean>(false);
  const [placedSuccess, setPlacedSuccess] = useState<string | null>(null);
  const [slipError, setSlipError] = useState<string | null>(null);

  // Estado del Simulador Rápido Libre (sin valores pre-llenados ni equipos inventados)
  const [quickMatch, setQuickMatch] = useState("");
  const [quickOdds, setQuickOdds] = useState("");
  const [quickProbPct, setQuickProbPct] = useState("");
  const [quickStake, setQuickStake] = useState("");

  // Cuando el usuario toca un momio real en la tabla, cargamos su probabilidad consenso
  useEffect(() => {
    if (activeSlip) {
      setTab("TICKET");
      setProbPercentStr((activeSlip.consensusProbability * 100).toFixed(1));
      setPlacedSuccess(null);
      setSlipError(null);
    }
  }, [activeSlip]);

  const numericStake = Math.max(0, Number(stakeStr) || 0);
  const numericTrueProb = Math.min(
    0.99,
    Math.max(0.01, (Number(probPercentStr) || 50) / 100)
  );

  const liveMetrics = computeEVAndKelly(
    activeSlip?.decimalOdds || 2.0,
    numericTrueProb,
    numericStake,
    availableBankroll
  );

  const parsedQuickOdds = Number(quickOdds);
  const parsedQuickProb = Number(quickProbPct);
  const parsedQuickStake = Number(quickStake);
  const hasValidQuickInputs =
    Number.isFinite(parsedQuickOdds) &&
    parsedQuickOdds > 1.0 &&
    Number.isFinite(parsedQuickProb) &&
    parsedQuickProb > 0 &&
    parsedQuickProb < 100 &&
    Number.isFinite(parsedQuickStake) &&
    parsedQuickStake > 0;

  const quickMetrics = hasValidQuickInputs
    ? computeEVAndKelly(
        parsedQuickOdds,
        parsedQuickProb / 100,
        parsedQuickStake,
        availableBankroll
      )
    : null;

  async function handleConfirmPaperBet() {
    if (!activeSlip) return;
    setSlipError(null);
    setPlacedSuccess(null);

    if (numericStake <= 0) {
      setSlipError("Enter a bet stake greater than $0.");
      return;
    }
    if (numericStake > availableBankroll) {
      setSlipError(
        `Insufficient balance. Your available bankroll is ${formatMoney(
          availableBankroll
        )}.`
      );
      return;
    }

    setPlacing(true);
    try {
      // Validamos y calculamos estrictamente contra POST /api/v1/calculations/ev en el backend
      const verified = await calculateCustomEV({
        match_name: activeSlip.matchName,
        decimal_odds: activeSlip.decimalOdds,
        true_probability: Number(numericTrueProb.toFixed(4)),
        stake: numericStake,
      });

      await placePaperBet({
        matchId: activeSlip.matchId,
        matchName: activeSlip.matchName,
        league: activeSlip.league,
        selection: activeSlip.selection,
        outcomeKey: activeSlip.outcomeKey,
        bookmaker: activeSlip.bookmaker,
        decimalOdds: verified.decimal_odds,
        impliedProbability: verified.implied_probability,
        trueProbability: verified.true_probability,
        stake: verified.stake,
        potentialProfit: verified.potential_profit,
        expectedValue: verified.expected_value,
        evPercentage: verified.ev_percentage,
        trafficLight: verified.traffic_light,
      });

      setPlacedSuccess(
        `Paper Bet placed: ${activeSlip.selection} (${formatMoney(
          verified.stake
        )})`
      );
      setStakeStr("");
      clearSlip();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setSlipError(err.payload.message);
      } else {
        setSlipError(
          "Could not validate the bet against the backend +EV engine (http://localhost:8000)."
        );
      }
    } finally {
      setPlacing(false);
    }
  }

  const recentPendingBets = paperBets
    .filter((b) => b.status === "PENDING")
    .slice(0, 3);

  const slipContent = (
    <div className="flex flex-col overflow-hidden rounded-lg border border-sb-border bg-sb-panel shadow-xl">
      {/* Cabecera Azul Estilo Boleto Playdoit */}
      <div className="flex items-center justify-between border-b border-sb-border bg-sb-header px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-sb-blue text-white">
            <IconTicket className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-white">
            Paper Bet Slip
          </span>
          {activeSlip && (
            <span className="rounded-full bg-sb-blue px-1.5 py-0.2 font-mono text-[10px] font-bold text-white">
              1
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {activeSlip && (
            <button
              type="button"
              onClick={clearSlip}
              title="Clear selection"
              className="rounded p-1 text-slate-400 transition hover:bg-sb-surface hover:text-rose-400"
            >
              <IconTrash className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileSlipOpen(false)}
            className="rounded p-1 text-slate-400 hover:text-white xl:hidden"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Pestañas Internas del Boleto */}
      <div className="grid grid-cols-2 border-b border-sb-border bg-sb-canvas text-xs font-bold">
        <button
          type="button"
          onClick={() => setTab("TICKET")}
          className={`border-b-2 py-2 transition ${
            tab === "TICKET"
              ? "border-sb-blue bg-sb-panel text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Active Selection
        </button>
        <button
          type="button"
          onClick={() => setTab("QUICK_CALC")}
          className={`border-b-2 py-2 transition ${
            tab === "QUICK_CALC"
              ? "border-sb-blue bg-sb-panel text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Quick Simulator
        </button>
      </div>

      {/* Contenido Pestaña 1: BOLETO */}
      {tab === "TICKET" ? (
        <div className="p-3.5">
          {placedSuccess && (
            <div className="mb-3 flex items-start gap-2 rounded border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs text-emerald-300">
              <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">{placedSuccess}</p>
                <Link
                  href="/bets"
                  className="mt-1 inline-block font-bold text-blue-400 underline hover:text-blue-300"
                >
                  View and settle in My Bets →
                </Link>
              </div>
            </div>
          )}

          {activeSlip ? (
            <div className="space-y-3.5">
              {/* Tarjeta del Momio Seleccionado */}
              <div className="rounded-md border border-blue-500/35 bg-sb-canvas p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {activeSlip.league}
                    </span>
                    <p className="truncate text-xs font-semibold text-slate-200">
                      {activeSlip.matchName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearSlip}
                    className="text-slate-500 hover:text-white"
                  >
                    <IconClose className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2.5 flex items-center justify-between rounded bg-sb-surface px-2.5 py-2">
                  <div className="min-w-0">
                    <span className="text-xs font-extrabold text-white">
                      {activeSlip.selection}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Best line: {activeSlip.bookmaker}
                    </p>
                  </div>
                  <span className="rounded bg-sb-blue px-2 py-1 font-mono text-sm font-black text-white tabular-nums">
                    {formatOdds(activeSlip.decimalOdds, oddsFormat)}
                  </span>
                </div>
              </div>

              {/* Control de Probabilidad Real Estimada */}
              <div className="rounded-md border border-sb-border bg-sb-canvas p-3">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">
                    Estimated True Prob. (%)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      step={0.5}
                      value={probPercentStr}
                      onChange={(e) => setProbPercentStr(e.target.value)}
                      className="w-16 rounded border border-sb-border bg-sb-panel px-1.5 py-0.5 text-right font-mono text-xs font-bold text-blue-400 tabular-nums focus:border-sb-blue focus:outline-none"
                    />
                    <span className="font-mono text-xs text-slate-400">%</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={5}
                  max={95}
                  step={0.5}
                  value={Number(probPercentStr) || 50}
                  onChange={(e) => setProbPercentStr(e.target.value)}
                  className="mt-2 h-1.5 w-full cursor-pointer accent-blue-500"
                />

                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    Bookie Implied:{" "}
                    <strong className="font-mono text-slate-200 tabular-nums">
                      {(liveMetrics.impliedProbability * 100).toFixed(1)}%
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setProbPercentStr(
                        (activeSlip.consensusProbability * 100).toFixed(1)
                      )
                    }
                    className="font-semibold text-blue-400 hover:underline"
                  >
                    Restore Consensus (
                    {(activeSlip.consensusProbability * 100).toFixed(1)}%)
                  </button>
                </div>
              </div>

              {/* Control de Stake + Botones Rápidos + Criterio de Kelly */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Paper Stake Amount ($)
                  </label>
                  <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                    Avail: {formatMoney(availableBankroll)}
                  </span>
                </div>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-2 font-mono text-sm font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min={1}
                    step={10}
                    value={stakeStr}
                    onChange={(e) => setStakeStr(e.target.value)}
                    placeholder="0"
                    className="w-full rounded border border-sb-border-light bg-sb-canvas py-2 pl-7 pr-3 text-right font-mono text-sm font-extrabold text-white placeholder-slate-600 tabular-nums focus:border-sb-blue focus:outline-none"
                  />
                </div>

                {/* Chips Rápidos de Stake */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[50, 100, 250, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setStakeStr(String(preset))}
                      className="rounded border border-sb-border bg-sb-surface py-1 font-mono text-[11px] font-bold text-slate-300 transition hover:border-blue-500/50 hover:text-white"
                    >
                      ${preset}
                    </button>
                  ))}
                </div>

                {/* Sugerencia Inteligente Criterio de Kelly (1/4 Kelly) */}
                {liveMetrics.quarterKellyStake > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setStakeStr(String(liveMetrics.quarterKellyStake))
                    }
                    className="flex w-full items-center justify-between rounded border border-blue-500/35 bg-sb-blue/12 px-2.5 py-1.5 text-left text-[11px] transition hover:bg-sb-blue/20"
                  >
                    <span className="flex items-center gap-1.5 font-semibold text-blue-300">
                      <IconBolt className="h-3.5 w-3.5 text-blue-400" />
                      <span>Use Optimal 1/4 Kelly</span>
                    </span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {formatMoney(liveMetrics.quarterKellyStake)}
                    </span>
                  </button>
                )}
              </div>

              {/* Desglose Financiero y Semáforo +EV */}
              <div className="space-y-2 rounded-md border border-sb-border bg-sb-canvas p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Rating:</span>
                  <TrafficLightBadge
                    color={liveMetrics.trafficLight}
                    evPercentage={liveMetrics.evPercentage}
                    compact
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Net Profit:</span>
                  <span className="font-mono font-bold text-slate-200 tabular-nums">
                    {formatMoney(liveMetrics.potentialProfit, true)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Payout:</span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    {formatMoney(liveMetrics.totalPayout)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-sb-border pt-2">
                  <span className="font-bold text-slate-200">
                    Expected Value (EV):
                  </span>
                  <span
                    className={`font-mono text-sm font-black tabular-nums ${
                      liveMetrics.expectedValue > 0
                        ? "text-emerald-400"
                        : liveMetrics.expectedValue === 0
                        ? "text-amber-300"
                        : "text-rose-400"
                    }`}
                  >
                    {formatMoney(liveMetrics.expectedValue, true)}
                  </span>
                </div>
              </div>

              {slipError && (
                <div className="rounded border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                  {slipError}
                </div>
              )}

              {/* CTA Principal Azul Playdoit/Sportsbook */}
              <button
                type="button"
                disabled={placing || numericStake <= 0}
                onClick={handleConfirmPaperBet}
                className="w-full rounded-md bg-sb-blue py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-blue-950/60 transition hover:bg-sb-blue-hover disabled:opacity-50"
              >
                {placing
                  ? "Validating in +EV Engine..."
                  : numericStake > 0
                  ? `Place Paper Bet (${formatMoney(numericStake)})`
                  : "Enter a stake amount"}
              </button>
            </div>
          ) : (
            /* Boleto Vacío estilo Playdoit */
            <div className="py-6 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-sb-border bg-sb-canvas text-slate-500">
                <IconTicket className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xs font-bold text-slate-200">
                Your bet slip is empty
              </p>
              <p className="mt-1 px-2 text-[11px] leading-relaxed text-slate-400">
                Click on any live odds from the main board to evaluate its mathematical edge (+EV) and log your simulation.
              </p>
            </div>
          )}

          {/* Mini-resumen de Paper Bets Pendientes */}
          {recentPendingBets.length > 0 && (
            <div className="mt-4 border-t border-sb-border pt-3">
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="font-bold uppercase tracking-wider text-slate-400">
                  In Play ({recentPendingBets.length})
                </span>
                <Link
                  href="/bets"
                  className="font-semibold text-blue-400 hover:underline"
                >
                  Manage all →
                </Link>
              </div>
              <div className="space-y-1.5">
                {recentPendingBets.map((bet) => (
                  <div
                    key={bet.id}
                    className="flex items-center justify-between rounded border border-sb-border/80 bg-sb-canvas px-2.5 py-1.5 text-[11px]"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-semibold text-slate-200">
                        {bet.selection}
                      </p>
                      <p className="truncate text-[10px] text-slate-500">
                        {bet.matchName}
                      </p>
                    </div>
                    <div className="shrink-0 text-right font-mono tabular-nums">
                      <span className="font-bold text-blue-400">
                        {formatOdds(bet.decimalOdds, oddsFormat)}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {formatMoney(bet.stake)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Contenido Pestaña 2: SIMULADOR RÁPIDO EN SIDEBAR (Cero datos pre-llenados) */
        <div className="space-y-3 p-3.5 text-xs">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Event / Note (Optional)
            </label>
            <input
              type="text"
              value={quickMatch}
              onChange={(e) => setQuickMatch(e.target.value)}
              placeholder="Enter match to evaluate..."
              className="mt-1 w-full rounded border border-sb-border bg-sb-canvas px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-sb-blue focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400">
                Dec Odds
              </label>
              <input
                type="number"
                step="0.01"
                min="1.02"
                value={quickOdds}
                onChange={(e) => setQuickOdds(e.target.value)}
                placeholder="2.10"
                className="mt-1 w-full rounded border border-sb-border bg-sb-canvas px-2 py-1.5 font-mono text-xs font-bold text-white placeholder-slate-600 tabular-nums focus:border-sb-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400">
                Prob %
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="99"
                value={quickProbPct}
                onChange={(e) => setQuickProbPct(e.target.value)}
                placeholder="50.0"
                className="mt-1 w-full rounded border border-sb-border bg-sb-canvas px-2 py-1.5 font-mono text-xs font-bold text-blue-400 placeholder-slate-600 tabular-nums focus:border-sb-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400">
                Stake $
              </label>
              <input
                type="number"
                step="10"
                min="1"
                value={quickStake}
                onChange={(e) => setQuickStake(e.target.value)}
                placeholder="100"
                className="mt-1 w-full rounded border border-sb-border bg-sb-canvas px-2 py-1.5 font-mono text-xs font-bold text-white placeholder-slate-600 tabular-nums focus:border-sb-blue focus:outline-none"
              />
            </div>
          </div>

          {quickMetrics ? (
            <div className="space-y-2 rounded border border-sb-border bg-sb-canvas p-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Signal:</span>
                <TrafficLightBadge
                  color={quickMetrics.trafficLight}
                  evPercentage={quickMetrics.evPercentage}
                  compact
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Equivalent Odds:</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {parsedQuickOdds.toFixed(2)} (
                  {formatOdds(parsedQuickOdds, "AMERICAN")})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Implied Prob.:</span>
                <span className="font-mono text-slate-300 tabular-nums">
                  {(quickMetrics.impliedProbability * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Suggested 1/4 Kelly:</span>
                <span className="font-mono font-bold text-blue-400 tabular-nums">
                  {formatMoney(quickMetrics.quarterKellyStake)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-sb-border pt-2">
                <span className="font-bold text-slate-200">
                  Expected Value:
                </span>
                <span
                  className={`font-mono text-sm font-black tabular-nums ${
                    quickMetrics.expectedValue > 0
                      ? "text-emerald-400"
                      : quickMetrics.expectedValue === 0
                      ? "text-amber-300"
                      : "text-rose-400"
                  }`}
                >
                  {formatMoney(quickMetrics.expectedValue, true)}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded border border-dashed border-sb-border bg-sb-canvas/60 p-3 text-center text-[11px] text-slate-400">
              Enter odds (&gt;1.01), probability (1–99%), and stake to calculate EV instantly.
            </div>
          )}

          <Link
            href="/calculator"
            className="block w-full rounded border border-blue-500/40 bg-sb-blue/15 py-2 text-center text-xs font-bold text-blue-300 transition hover:bg-sb-blue/25"
          >
            Open Full Calculator →
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Sidebar Derecho Fijo en Escritorio (xl+) */}
      <aside className="hidden w-[332px] shrink-0 xl:block">
        <div className="sticky top-[72px]">{slipContent}</div>
      </aside>

      {/* Barra Flotante Inferior de Boleto en Móvil / Tablet (< xl) */}
      {activeSlip && !mobileSlipOpen && (
        <div className="fixed inset-x-3 bottom-3 z-40 xl:hidden">
          <button
            type="button"
            onClick={() => setMobileSlipOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border border-blue-400/50 bg-sb-blue px-4 py-3 text-white shadow-2xl shadow-black"
          >
            <div className="flex items-center gap-2.5 text-left">
              <IconTicket className="h-5 w-5" />
              <div className="leading-tight">
                <p className="text-xs font-extrabold">{activeSlip.selection}</p>
                <p className="text-[11px] text-blue-100">
                  Tap to open your Paper Bet Slip
                </p>
              </div>
            </div>
            <span className="rounded bg-black/25 px-2.5 py-1 font-mono text-sm font-black tabular-nums">
              {formatOdds(activeSlip.decimalOdds, oddsFormat)}
            </span>
          </button>
        </div>
      )}

      {/* Drawer / Modal Deslizable del Boleto en Móvil / Tablet (< xl) */}
      {mobileSlipOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-2 backdrop-blur-sm sm:items-center sm:p-4 xl:hidden">
          <div className="w-full max-w-md">{slipContent}</div>
        </div>
      )}
    </>
  );
}
