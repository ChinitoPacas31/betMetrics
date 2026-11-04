"use client";

import React, { useState } from "react";
import { ApiClientError, calculateCustomEV } from "@/lib/api";
import { EVCalculationResponse } from "@/types";
import TrafficLightBadge from "./TrafficLightBadge";

export default function EVCalculatorForm() {
  const [matchName, setMatchName] = useState("Arsenal vs Chelsea");
  const [decimalOdds, setDecimalOdds] = useState("2.15");
  const [trueProbability, setTrueProbability] = useState("0.52");
  const [stake, setStake] = useState("100");

  const [result, setResult] = useState<EVCalculationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Array<{ field: string; message: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors([]);
    setIsLoading(true);

    try {
      const response = await calculateCustomEV({
        match_name: matchName.trim() || "Custom Simulation Match",
        decimal_odds: Number(decimalOdds),
        true_probability: Number(trueProbability),
        stake: Number(stake),
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

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl lg:col-span-6"
      >
        <h2 className="text-xl font-bold text-white">
          Parámetros de Simulación (Paper Betting)
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Ingresa la cuota decimal, tu probabilidad real estimada (0 a 1) y el
          monto virtual a arriesgar.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Evento Deportivo
            </label>
            <input
              type="text"
              value={matchName}
              onChange={(e) => setMatchName(e.target.value)}
              placeholder="Ej. Real Madrid vs Manchester City"
              required
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Cuota Decimal (&gt; 1.0)
              </label>
              <input
                type="number"
                step="0.01"
                value={decimalOdds}
                onChange={(e) => setDecimalOdds(e.target.value)}
                required
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Probabilidad (0 - 1)
              </label>
              <input
                type="number"
                step="0.01"
                value={trueProbability}
                onChange={(e) => setTrueProbability(e.target.value)}
                required
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Stake USD (&gt; 0)
              </label>
              <input
                type="number"
                step="1"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                required
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3.5 text-sm text-rose-300">
              <p className="font-semibold">Error de validación (HTTP 400):</p>
              <p className="mt-0.5 text-xs">{errorMessage}</p>
              {fieldErrors.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-xs">
                  {fieldErrors.map((err, idx) => (
                    <li key={idx}>
                      <span className="font-mono">{err.field}</span>:{" "}
                      {err.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-md transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {isLoading
              ? "Calculando en Microservicio..."
              : "Calcular Valor Esperado (+EV)"}
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl lg:col-span-6">
        <h2 className="text-xl font-bold text-white">
          Resultado del Motor Matemático
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Fórmula: EV = (P_win × Profit) - (P_loss × Stake)
        </p>

        {result ? (
          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">
                  Evento Simulado
                </p>
                <h3 className="text-lg font-bold text-white">
                  {result.match_name}
                </h3>
              </div>
              <TrafficLightBadge
                color={result.traffic_light}
                evPercentage={result.ev_percentage}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <p className="text-xs text-slate-400">Valor Esperado (EV)</p>
                <p
                  className={`mt-1 text-lg font-extrabold ${
                    result.expected_value > 0
                      ? "text-emerald-400"
                      : result.expected_value === 0
                      ? "text-amber-300"
                      : "text-rose-400"
                  }`}
                >
                  {result.expected_value > 0 ? "+" : ""}$
                  {result.expected_value.toFixed(2)}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <p className="text-xs text-slate-400">ROI / EV %</p>
                <p className="mt-1 text-lg font-extrabold text-white">
                  {result.ev_percentage > 0 ? "+" : ""}
                  {result.ev_percentage.toFixed(2)}%
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <p className="text-xs text-slate-400">Beneficio Neto</p>
                <p className="mt-1 text-lg font-bold text-emerald-300">
                  +${result.potential_profit.toFixed(2)}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <p className="text-xs text-slate-400">Prob. Implícita</p>
                <p className="mt-1 text-lg font-bold text-slate-200">
                  {(result.implied_probability * 100).toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Dictamen del Semáforo de Confianza
              </p>
              <p className="mt-1 text-sm text-slate-200">
                {result.recommendation}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex h-56 flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 text-center p-6">
            <p className="text-sm text-slate-400">
              Completa el formulario y presiona{" "}
              <span className="font-semibold text-emerald-400">
                Calcular Valor Esperado (+EV)
              </span>{" "}
              para consultar el endpoint{" "}
              <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">
                POST /api/v1/calculations/ev
              </code>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

