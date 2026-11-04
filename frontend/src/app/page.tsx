"use client";

import { useCallback, useEffect, useState } from "react";
import MatchCard from "@/components/MatchCard";
import { fetchOddsEV } from "@/lib/api";
import { OddsEVListResponse, TrafficLightColor } from "@/types";

export default function HomePage() {
  const [data, setData] = useState<OddsEVListResponse | null>(null);
  const [stake, setStake] = useState<number>(100);
  const [filterColor, setFilterColor] = useState<TrafficLightColor | "ALL">(
    "ALL"
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadOdds = useCallback(async (currentStake: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchOddsEV("soccer_epl", currentStake);
      setData(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al conectar con el microservicio FastAPI."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOdds(100);
  }, [loadOdds]);

  const filteredItems =
    data?.items.filter((item) =>
      filterColor === "ALL" ? true : item.traffic_light === filterColor
    ) ?? [];

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 p-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
              Live +EV Scanner
            </span>
            {data && (
              <span className="inline-flex items-center rounded-md bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                {data.cached
                  ? `Caché Resiliente (${data.source})`
                  : "RapidAPI Live"}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Monitor de Cuotas con Valor Esperado (+EV)
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Clasificación automática por semáforo estadístico: Verde (&gt; 3.0%
            EV), Amarillo (0.0% a 3.0% EV) y Rojo (&lt; 0.0% EV).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
            <label className="text-xs font-semibold uppercase text-slate-400">
              Paper Stake ($):
            </label>
            <input
              type="number"
              min={1}
              max={100000}
              value={stake}
              onChange={(e) => setStake(Number(e.target.value) || 100)}
              className="w-20 rounded bg-slate-900 px-2 py-1 text-right text-sm font-bold text-emerald-400 focus:outline-none"
            />
          </div>
          <button
            onClick={() => loadOdds(stake)}
            className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Recalcular Cuotas
          </button>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "GREEN", "YELLOW", "RED"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterColor(status)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                filterColor === status
                  ? "bg-emerald-500 text-slate-950"
                  : "border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {status === "ALL"
                ? "Todos los Eventos"
                : status === "GREEN"
                ? "🟢 +EV (> 3%)"
                : status === "YELLOW"
                ? "🟡 Neutral (0% - 3%)"
                : "🔴 Alto Riesgo (< 0%)"}
            </button>
          ))}
        </div>
        {data && (
          <p className="text-xs text-slate-400">
            Mostrando {filteredItems.length} de {data.count} eventos analizados
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((skeleton) => (
            <div
              key={skeleton}
              className="h-64 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50 p-5"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-6 text-rose-200">
          <h3 className="text-base font-bold">
            No se pudo obtener el feed de cuotas
          </h3>
          <p className="mt-1 text-sm">{error}</p>
          <p className="mt-2 text-xs text-rose-300/80">
            Verifica que el microservicio FastAPI esté ejecutándose en{" "}
            <code>http://localhost:8000</code>.
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((match) => (
            <MatchCard key={match.match_id} match={match} />
          ))}
        </section>
      )}
    </div>
  );
}

