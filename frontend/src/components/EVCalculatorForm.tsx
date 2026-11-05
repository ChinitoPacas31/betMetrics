"use client";

import React, { useState } from "react";
import { useBetting } from "@/context/BettingContext";
import { ApiClientError, calculateCustomEV } from "@/lib/api";
import {
  americanToDecimal,
  computeEVAndKelly,
  decimalToAmerican,
  formatMoney,
} from "@/lib/oddsUtils";
import { EVCalculationResponse } from "@/types";
import { IconBolt, IconCheck, IconShield } from "./Icons";
import TrafficLightBadge from "./TrafficLightBadge";

type InputOddsMode = "DECIMAL" | "AMERICAN";

export default function EVCalculatorForm() {
  const { availableBankroll, placePaperBet } = useBetting();

  const [matchName, setMatchName] = useState("");
  const [selectionLabel, setSelectionLabel] = useState("");
  const [bookmaker, setBookmaker] = useState("");
  const [inputMode, setInputMode] = useState<InputOddsMode>("DECIMAL");
  const [oddsInput, setOddsInput] = useState("");
  const [trueProbPct, setTrueProbPct] = useState("");
  const [stake, setStake] = useState("");

  const [result, setResult] = useState<EVCalculationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Array<{ field: string; message: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const hasValidOdds = oddsInput.trim() !== "" && Number.isFinite(Number(oddsInput));
  const resolvedDecimalOdds = hasValidOdds
    ? inputMode === "DECIMAL"
      ? Number(oddsInput)
      : americanToDecimal(Number(oddsInput))
    : 0;

  const resolvedProbFraction =
    trueProbPct.trim() !== "" ? (Number(trueProbPct) || 0) / 100 : 0;
  const resolvedStake = stake.trim() !== "" ? Number(stake) || 0 : 0;

  const kellyPreview =
    resolvedDecimalOdds > 1.0 &&
    resolvedProbFraction > 0 &&
    resolvedProbFraction < 1
      ? computeEVAndKelly(
          resolvedDecimalOdds,
          resolvedProbFraction,
          Math.max(resolvedStake, 1),
          availableBankroll
        )
      : null;

  function switchInputMode(mode: InputOddsMode) {
    if (mode === inputMode) return;
    if (oddsInput.trim() !== "" && Number.isFinite(Number(oddsInput))) {
      if (mode === "AMERICAN") {
        const am = decimalToAmerican(Number(oddsInput) || 2.0).replace("+", "");
        setOddsInput(am);
      } else {
        const dec = americanToDecimal(Number(oddsInput) || 100);
        setOddsInput(dec.toFixed(2));
      }
    }
    setInputMode(mode);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors([]);
    setSavedNotice(false);
    setIsLoading(true);

    try {
      const response = await calculateCustomEV({
        match_name: matchName.trim(),
        decimal_odds: Number(resolvedDecimalOdds.toFixed(3)),
        true_probability: Number(resolvedProbFraction.toFixed(4)),
        stake: resolvedStake,
      });
      setResult(response);
    } catch (err) {
      setResult(null);
      if (err instanceof ApiClientError) {
        setErrorMessage(err.payload.message);
        if (err.payload.details) {
          setFieldErrors(err.payload.details);
        }
      } else {
        setErrorMessage(
          "No se pudo conectar con el microservicio FastAPI en http://localhost:8000."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleSaveToPortfolio() {
    if (!result) return;
    placePaperBet({
      matchId: `custom-${Date.now()}`,
      matchName: result.match_name,
      league: "Calculadora Manual",
      selection: selectionLabel.trim() || result.match_name,
      outcomeKey: "CUSTOM",
      bookmaker: bookmaker.trim() || "Manual",
      decimalOdds: result.decimal_odds,
      impliedProbability: result.implied_probability,
      trueProbability: result.true_probability,
      stake: result.stake,
      potentialProfit: result.potential_profit,
      expectedValue: result.expected_value,
      evPercentage: result.ev_percentage,
      trafficLight: result.traffic_light,
    });
    setSavedNotice(true);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Columna Izquierda: Parámetros de Entrada */}
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-sb-border bg-sb-panel p-5 lg:col-span-6"
      >
        <div className="flex items-center justify-between border-b border-sb-border pb-3">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Parámetros de Entrada
            </h2>
            <p className="text-xs text-slate-400">
              Validación directa contra <code>POST /api/v1/calculations/ev</code>
            </p>
          </div>
          <div className="flex rounded border border-sb-border bg-sb-canvas p-0.5 text-[11px] font-mono font-bold">
            <button
              type="button"
              onClick={() => switchInputMode("DECIMAL")}
              className={`rounded px-2.5 py-1 transition ${
                inputMode === "DECIMAL"
                  ? "bg-sb-blue text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Decimal
            </button>
            <button
              type="button"
              onClick={() => switchInputMode("AMERICAN")}
              className={`rounded px-2.5 py-1 transition ${
                inputMode === "AMERICAN"
                  ? "bg-sb-blue text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Americano
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3.5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Partido / Evento
              </label>
              <input
                type="text"
                value={matchName}
                onChange={(e) => setMatchName(e.target.value)}
                placeholder="Ej. Local vs Visitante"
                required
                className="mt-1 w-full rounded border border-sb-border bg-sb-canvas px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sb-blue focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Selección
                </label>
                <input
                  type="text"
                  value={selectionLabel}
                  onChange={(e) => setSelectionLabel(e.target.value)}
                  placeholder="Ej. Local ML"
                  className="mt-1 w-full rounded border border-sb-border bg-sb-canvas px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sb-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Casa
                </label>
                <input
                  type="text"
                  value={bookmaker}
                  onChange={(e) => setBookmaker(e.target.value)}
                  placeholder="Casa de apuestas"
                  className="mt-1 w-full rounded border border-sb-border bg-sb-canvas px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sb-blue focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                {inputMode === "DECIMAL"
                  ? "Momio Decimal (>1.0)"
                  : "Momio US (ej. -110, 135)"}
              </label>
              <input
                type="number"
                step={inputMode === "DECIMAL" ? "0.01" : "1"}
                value={oddsInput}
                onChange={(e) => setOddsInput(e.target.value)}
                placeholder={inputMode === "DECIMAL" ? "2.15" : "115"}
                required
                className="mt-1 w-full rounded border border-sb-border bg-sb-canvas px-3 py-2 font-mono text-sm font-bold text-white placeholder-slate-600 tabular-nums focus:border-sb-blue focus:outline-none"
              />
              {resolvedDecimalOdds > 1.0 && (
                <p className="mt-1 font-mono text-[10px] text-slate-500">
                  Equivale a:{" "}
                  {inputMode === "DECIMAL"
                    ? decimalToAmerican(resolvedDecimalOdds)
                    : resolvedDecimalOdds.toFixed(3)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Prob. Real (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={trueProbPct}
                onChange={(e) => setTrueProbPct(e.target.value)}
                placeholder="50.0"
                required
                className="mt-1 w-full rounded border border-sb-border bg-sb-canvas px-3 py-2 font-mono text-sm font-bold text-blue-400 placeholder-slate-600 tabular-nums focus:border-sb-blue focus:outline-none"
              />
              {resolvedProbFraction > 0 && (
                <p className="mt-1 font-mono text-[10px] text-slate-500">
                  Fracción API: {resolvedProbFraction.toFixed(4)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Stake ($)
              </label>
              <input
                type="number"
                step="1"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="100"
                required
                className="mt-1 w-full rounded border border-sb-border bg-sb-canvas px-3 py-2 font-mono text-sm font-bold text-white placeholder-slate-600 tabular-nums focus:border-sb-blue focus:outline-none"
              />
              {kellyPreview && kellyPreview.quarterKellyStake > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setStake(String(kellyPreview.quarterKellyStake))
                  }
                  className="mt-1 font-mono text-[10px] font-semibold text-blue-400 hover:underline"
                >
                  Usar 1/4 Kelly ({formatMoney(kellyPreview.quarterKellyStake)})
                </button>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="rounded border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
              <p className="font-bold">Rechazado por validación:</p>
              <p className="mt-0.5">{errorMessage}</p>
              {fieldErrors.length > 0 && (
                <ul className="mt-1.5 list-disc pl-4 font-mono text-[11px]">
                  {fieldErrors.map((err, idx) => (
                    <li key={idx}>
                      {err.field}: {err.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-sb-blue py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-blue-950/60 transition hover:bg-sb-blue-hover disabled:opacity-50"
          >
            <IconBolt className="h-4 w-4" />
            <span>
              {isLoading
                ? "Ejecutando Motor Cuantitativo..."
                : "Calcular Valor Esperado (+EV)"}
            </span>
          </button>
        </div>
      </form>

      {/* Columna Derecha: Dictamen del Motor Matemático + Dimensionamiento Kelly */}
      <div className="rounded-lg border border-sb-border bg-sb-panel p-5 lg:col-span-6">
        <div className="flex items-center justify-between border-b border-sb-border pb-3">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Dictamen Cuantitativo &amp; Dimensionamiento Kelly
            </h2>
            <p className="text-xs text-slate-400">
              Comparativa de ventaja real sobre el vigorish de la casa
            </p>
          </div>
          <IconShield className="h-5 w-5 text-blue-400" />
        </div>

        {result ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-sb-border bg-sb-canvas p-3">
              <div>
                {(bookmaker.trim() || selectionLabel.trim()) && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {[bookmaker.trim(), selectionLabel.trim()]
                      .filter(Boolean)
                      .join(" • ")}
                  </span>
                )}
                <h3 className="text-base font-extrabold text-white">
                  {result.match_name}
                </h3>
              </div>
              <TrafficLightBadge
                color={result.traffic_light}
                evPercentage={result.ev_percentage}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded border border-sb-border bg-sb-canvas p-3">
                <p className="text-[10px] font-bold uppercase text-slate-500">
                  Valor Esperado
                </p>
                <p
                  className={`mt-1 font-mono text-base font-black tabular-nums ${
                    result.expected_value > 0
                      ? "text-emerald-400"
                      : result.expected_value === 0
                      ? "text-amber-300"
                      : "text-rose-400"
                  }`}
                >
                  {formatMoney(result.expected_value, true)}
                </p>
              </div>
              <div className="rounded border border-sb-border bg-sb-canvas p-3">
                <p className="text-[10px] font-bold uppercase text-slate-500">
                  Ventaja / Edge
                </p>
                <p className="mt-1 font-mono text-base font-black text-white tabular-nums">
                  {result.ev_percentage > 0 ? "+" : ""}
                  {result.ev_percentage.toFixed(2)}%
                </p>
              </div>
              <div className="rounded border border-sb-border bg-sb-canvas p-3">
                <p className="text-[10px] font-bold uppercase text-slate-500">
                  Ganancia Neta
                </p>
                <p className="mt-1 font-mono text-base font-bold text-emerald-400 tabular-nums">
                  +{formatMoney(result.potential_profit)}
                </p>
              </div>
              <div className="rounded border border-sb-border bg-sb-canvas p-3">
                <p className="text-[10px] font-bold uppercase text-slate-500">
                  Prob. Implícita
                </p>
                <p className="mt-1 font-mono text-base font-bold text-slate-200 tabular-nums">
                  {(result.implied_probability * 100).toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Tabla de Fracciones de Kelly según Bankroll actual */}
            {kellyPreview && (
              <div className="rounded border border-sb-border bg-sb-canvas p-3">
                <div className="mb-2 flex items-center justify-between text-[11px]">
                  <span className="font-bold uppercase tracking-wider text-slate-400">
                    Gestión de Riesgo Kelly (Bankroll{" "}
                    {formatMoney(availableBankroll)})
                  </span>
                  <span className="font-mono text-blue-400 tabular-nums">
                    Full Kelly:{" "}
                    {(kellyPreview.fullKellyFraction * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs tabular-nums">
                  <div className="rounded border border-sb-border bg-sb-panel p-2">
                    <span className="block font-sans text-[10px] text-slate-400">
                      1/4 Kelly (Conservador)
                    </span>
                    <strong className="text-blue-400">
                      {formatMoney(
                        Math.round(
                          availableBankroll *
                            kellyPreview.fullKellyFraction *
                            0.25
                        )
                      )}
                    </strong>
                  </div>
                  <div className="rounded border border-sb-border bg-sb-panel p-2">
                    <span className="block font-sans text-[10px] text-slate-400">
                      1/2 Kelly (Moderado)
                    </span>
                    <strong className="text-slate-200">
                      {formatMoney(
                        Math.round(
                          availableBankroll *
                            kellyPreview.fullKellyFraction *
                            0.5
                        )
                      )}
                    </strong>
                  </div>
                  <div className="rounded border border-sb-border bg-sb-panel p-2">
                    <span className="block font-sans text-[10px] text-slate-400">
                      Full Kelly (Agresivo)
                    </span>
                    <strong className="text-slate-300">
                      {formatMoney(
                        Math.round(
                          availableBankroll * kellyPreview.fullKellyFraction
                        )
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded border border-sb-border bg-sb-canvas p-3 text-xs text-slate-300">
              {result.recommendation}
            </div>

            {savedNotice ? (
              <div className="flex items-center justify-center gap-2 rounded border border-emerald-500/40 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-300">
                <IconCheck className="h-4 w-4" />
                <span>Guardada en tu portafolio de Mis Apuestas</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSaveToPortfolio}
                className="w-full rounded border border-blue-500/50 bg-sb-blue/15 py-2.5 text-xs font-bold text-blue-300 transition hover:bg-sb-blue hover:text-white"
              >
                + Registrar esta Simulación en Mi Bankroll (
                {formatMoney(result.stake)})
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 flex h-64 flex-col items-center justify-center rounded border border-dashed border-sb-border bg-sb-canvas/60 p-6 text-center">
            <IconBolt className="h-7 w-7 text-slate-600" />
            <p className="mt-2 text-xs font-bold text-slate-300">
              Listo para evaluar escenario
            </p>
            <p className="mt-1 max-w-sm text-[11px] text-slate-500">
              Ingresa cualquier cuota (Decimal o Americana) y tu probabilidad estimada para calcular el Valor Esperado exacto y el stake óptimo de Kelly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
