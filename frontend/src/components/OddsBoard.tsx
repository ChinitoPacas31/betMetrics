"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useBetting } from "@/context/BettingContext";
import { fetchOddsEV } from "@/lib/api";
import { MatchOddsEVItem, OddsEVListResponse, TrafficLightColor } from "@/types";
import {
  getSportIcon,
  IconBolt,
  IconChevronDown,
  IconChevronRight,
  IconRefresh,
  IconSearch,
} from "./Icons";
import MatchRow from "./MatchRow";

type SortMode = "BEST_EV" | "KICKOFF";

export default function OddsBoard() {
  const {
    sportsCatalog,
    sportsLoading,
    sportsError,
    reloadSportsCatalog,
    activeSport,
    setActiveSport,
    searchQuery,
    setSearchQuery,
    onlyPositiveEV,
    setOnlyPositiveEV,
  } = useBetting();

  const [data, setData] = useState<OddsEVListResponse | null>(null);
  const [baseStake, setBaseStake] = useState<number>(100);
  const [filterLight, setFilterLight] = useState<TrafficLightColor | "ALL">(
    "ALL"
  );
  const [sortMode, setSortMode] = useState<SortMode>("BEST_EV");
  const [collapsedLeagues, setCollapsedLeagues] = useState<
    Record<string, boolean>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(
    async (sportKey: string, stakeAmount: number) => {
      if (!sportKey) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchOddsEV(sportKey, stakeAmount);
        setData(res);
      } catch (err) {
        setData(null);
        setError(
          err instanceof Error
            ? err.message
            : "Error connecting to the FastAPI microservice."
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!activeSport) return;
    loadFeed(activeSport, baseStake);
  }, [activeSport, baseStake, loadFeed]);

  // Recargar automáticamente si el usuario dispara Admin Sync desde la barra superior
  useEffect(() => {
    function onSynced() {
      if (activeSport) {
        loadFeed(activeSport, baseStake);
      }
    }
    window.addEventListener("betmetrics:odds-synced", onSynced);
    return () => window.removeEventListener("betmetrics:odds-synced", onSynced);
  }, [activeSport, baseStake, loadFeed]);

  // Sincronizar el switch lateral "Solo Valor +EV" con las pestañas de filtro
  useEffect(() => {
    if (onlyPositiveEV) {
      setFilterLight("GREEN");
    } else if (filterLight === "GREEN") {
      setFilterLight("ALL");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyPositiveEV]);

  const catalogByKey = useMemo(() => {
    const map = new Map<string, (typeof sportsCatalog)[number]>();
    for (const item of sportsCatalog) {
      map.set(item.sport_key, item);
    }
    return map;
  }, [sportsCatalog]);

  const activeLeagueMeta = useMemo(() => {
    const found = catalogByKey.get(activeSport);
    if (found) return found;
    return {
      sport_key: activeSport,
      title: activeSport || "Loading active leagues...",
      country: "",
      category: "",
      market_type: "h2h_2way",
    };
  }, [catalogByKey, activeSport]);

  // Filtrado y ordenamiento del tablero
  const filteredMatches = useMemo(() => {
    const items = data?.items ?? [];
    const q = searchQuery.trim().toLowerCase();

    const filtered = items.filter((item) => {
      if (filterLight !== "ALL" && item.traffic_light !== filterLight) {
        return false;
      }
      if (q) {
        const haystack = `${item.home_team} ${item.away_team} ${item.league} ${item.bookmaker}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "BEST_EV") {
        return b.ev_percentage - a.ev_percentage;
      }
      return (
        new Date(a.commence_time).getTime() -
        new Date(b.commence_time).getTime()
      );
    });
  }, [data, filterLight, searchQuery, sortMode]);

  // Agrupación dinámica por Liga estilo Altenar / Playdoit
  const groupedByLeague = useMemo(() => {
    const map = new Map<
      string,
      {
        league: string;
        categoryLabel: string;
        sportKey: string;
        is3Way: boolean;
        matches: MatchOddsEVItem[];
      }
    >();

    for (const match of filteredMatches) {
      const catMeta = catalogByKey.get(match.sport_key);
      const categoryLabel =
        catMeta?.category || match.country || match.sport_key;
      const leagueLabel = catMeta?.title || match.league || match.sport_key;
      const key = `${categoryLabel}::${leagueLabel}`;
      const existing = map.get(key);
      const is3Way = (match.outcomes?.length ?? 0) === 3;
      if (existing) {
        existing.matches.push(match);
      } else {
        map.set(key, {
          league: leagueLabel,
          categoryLabel,
          sportKey: match.sport_key,
          is3Way,
          matches: [match],
        });
      }
    }

    return Array.from(map.entries());
  }, [filteredMatches, catalogByKey]);

  // Métricas reales del mercado actual
  const marketStats = useMemo(() => {
    const items = data?.items ?? [];
    const greenCount = items.filter((i) => i.traffic_light === "GREEN").length;
    const bestEdge =
      items.length > 0 ? Math.max(...items.map((i) => i.ev_percentage)) : 0;
    return {
      total: items.length,
      greenCount,
      bestEdge,
    };
  }, [data]);

  function toggleLeagueCollapse(groupKey: string) {
    setCollapsedLeagues((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }

  const showBoardSkeleton =
    isLoading || (sportsLoading && !activeSport && !sportsError);
  const activeError = error || (!activeSport ? sportsError : null);

  return (
    <div className="min-w-0 flex-1 space-y-3">
      {/* Navegador Horizontal Dinámico de Ligas y Búsqueda (Solo visible en Móvil/Tablet < lg) */}
      <div className="space-y-2 lg:hidden">
        {sportsCatalog.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sportsCatalog.map((league) => {
              const active = activeSport === league.sport_key;
              return (
                <button
                  key={league.sport_key}
                  type="button"
                  onClick={() => setActiveSport(league.sport_key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "border-blue-500 bg-sb-blue text-white"
                      : "border-sb-border bg-sb-panel text-slate-300"
                  }`}
                >
                  {getSportIcon(league.sport_key, "h-3.5 w-3.5")}
                  <span>{league.title}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter teams on screen..."
            className="w-full rounded-md border border-sb-border bg-sb-panel py-2 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-sb-blue focus:outline-none"
          />
        </div>
      </div>

      {/* Cabecera Compacta del Tablero + KPIs Cuantitativos */}
      <div className="rounded-lg border border-sb-border bg-sb-panel p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-blue-500/30 bg-sb-blue/15 text-blue-400">
              {getSportIcon(activeLeagueMeta.sport_key, "h-4 w-4")}
            </div>
            <h1 className="text-base font-extrabold tracking-tight text-white sm:text-lg">
              {activeLeagueMeta.title}
            </h1>
          </div>

          {/* Controles Rápidos: Stake Base + Refrescar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded border border-sb-border bg-sb-canvas px-2.5 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Base Stake $
              </span>
              <input
                type="number"
                min={10}
                max={100000}
                step={10}
                value={baseStake}
                onChange={(e) =>
                  setBaseStake(Math.max(1, Number(e.target.value) || 100))
                }
                className="w-16 bg-transparent text-right font-mono text-xs font-bold text-blue-400 tabular-nums focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (activeSport) {
                  loadFeed(activeSport, baseStake);
                } else {
                  reloadSportsCatalog();
                }
              }}
              disabled={showBoardSkeleton}
              className="flex items-center gap-1.5 rounded bg-sb-blue px-3 py-1.5 text-xs font-bold text-white transition hover:bg-sb-blue-hover disabled:opacity-50"
            >
              <IconRefresh
                className={`h-3.5 w-3.5 ${
                  showBoardSkeleton ? "animate-spin" : ""
                }`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Tira de Métricas Compacta */}
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-sb-border pt-3">
          <div className="rounded border border-sb-border/80 bg-sb-canvas px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Active Events
            </span>
            <p className="mt-0.5 font-mono text-sm font-bold text-white tabular-nums">
              {marketStats.total}
            </p>
          </div>
          <div className="rounded border border-sb-border/80 bg-sb-canvas px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              +EV Lines (&gt;3%)
            </span>
            <p className="mt-0.5 font-mono text-sm font-bold text-emerald-400 tabular-nums">
              {marketStats.greenCount}
            </p>
          </div>
          <div className="rounded border border-sb-border/80 bg-sb-canvas px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Best Edge
            </span>
            <p
              className={`mt-0.5 font-mono text-sm font-bold tabular-nums ${
                marketStats.bestEdge > 0 ? "text-emerald-400" : "text-slate-300"
              }`}
            >
              {marketStats.bestEdge > 0 ? "+" : ""}
              {marketStats.bestEdge.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Aviso Transparente cuando RapidAPI responde HTTP 429 o error y Redis entrega captura real previa */}
      {data?.source === "redis_stale_429" && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          <p className="font-bold text-amber-300">
            RapidAPI quota limit reached (HTTP 429 Too Many Requests)
          </p>
          <p className="mt-0.5 text-amber-200/90">
            Showing the latest <strong>100% real</strong> snapshot previously saved in Redis (<em>Stale-If-Error</em> mode, zero synthetic data). Once your RapidAPI quota renews, you will be able to sync fresh odds.
          </p>
        </div>
      )}

      {data?.source === "redis_stale_error" && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          <p className="font-bold text-amber-300">
            External provider temporarily unreachable
          </p>
          <p className="mt-0.5 text-amber-200/90">
            Showing the latest real snapshot stored in Redis without generating simulated data.
          </p>
        </div>
      )}

      {/* Barra de Filtros de Semáforo y Ordenamiento */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sb-border bg-sb-panel px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "ALL", label: "All" },
              { id: "GREEN", label: "Value +EV (>3%)" },
              { id: "YELLOW", label: "Neutral (0–3%)" },
              { id: "RED", label: "Negative EV" },
            ] as const
          ).map((tab) => {
            const active = filterLight === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilterLight(tab.id);
                  if (tab.id !== "GREEN" && onlyPositiveEV) {
                    setOnlyPositiveEV(false);
                  }
                }}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition ${
                  active
                    ? "bg-sb-blue text-white"
                    : "text-slate-400 hover:bg-sb-surface hover:text-white"
                }`}
              >
                {tab.id === "GREEN" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
                {tab.id === "YELLOW" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                )}
                {tab.id === "RED" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="hidden text-[11px] text-slate-500 sm:inline">
            Sort by:
          </span>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="rounded border border-sb-border bg-sb-canvas px-2.5 py-1 text-xs font-semibold text-slate-200 focus:border-sb-blue focus:outline-none"
          >
            <option value="BEST_EV">Highest Edge (+EV%)</option>
            <option value="KICKOFF">Kickoff Time</option>
          </select>
        </div>
      </div>

      {/* Cuerpo del Tablero: Estados de Carga / Error / Tablas por Liga */}
      {showBoardSkeleton ? (
        <div className="overflow-hidden rounded-lg border border-sb-border bg-sb-panel">
          <div className="h-9 animate-pulse border-b border-sb-border bg-sb-header" />
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between border-b border-sb-border/70 px-3 py-3 last:border-b-0"
            >
              <div className="space-y-2">
                <div className="h-3.5 w-44 animate-pulse rounded bg-sb-odds" />
                <div className="h-3.5 w-36 animate-pulse rounded bg-sb-odds" />
              </div>
              <div className="flex gap-1.5">
                <div className="h-11 w-24 animate-pulse rounded bg-sb-odds" />
                <div className="h-11 w-24 animate-pulse rounded bg-sb-odds" />
                <div className="h-11 w-24 animate-pulse rounded bg-sb-odds" />
              </div>
            </div>
          ))}
        </div>
      ) : activeError ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-5 text-rose-200">
          <p className="text-sm font-bold">
            Could not fetch live odds at this time
          </p>
          <p className="mt-1 text-xs text-rose-300">{activeError}</p>
          <p className="mt-2 text-xs text-rose-300/80">
            BetMetrics does not display fake matches or synthetic seeds. Check your FastAPI/Redis service at{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono">
              http://localhost:8000
            </code>{" "}
            and your RapidAPI quota status.
          </p>
          <button
            type="button"
            onClick={() => {
              if (activeSport) {
                loadFeed(activeSport, baseStake);
              } else {
                reloadSportsCatalog();
              }
            }}
            className="mt-3 rounded bg-sb-blue px-3.5 py-1.5 text-xs font-bold text-white hover:bg-sb-blue-hover"
          >
            Retry request
          </button>
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-sb-border bg-sb-panel px-4 py-12 text-center">
          <IconBolt className="h-7 w-7 text-slate-500" />
          <p className="mt-2 text-sm font-bold text-slate-200">
            No open H2H events in RapidAPI for this league
          </p>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            The provider returned 0 matches with active H2H lines right now for{" "}
            <strong className="text-slate-200">{activeLeagueMeta.title}</strong>. Please select another active league from the left panel.
          </p>
        </div>
      ) : groupedByLeague.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-sb-border bg-sb-panel px-4 py-12 text-center">
          <IconBolt className="h-7 w-7 text-slate-500" />
          <p className="mt-2 text-sm font-bold text-slate-200">
            No matches match the current filters
          </p>
          <p className="mt-1 text-xs text-slate-400">
            There are {data?.items.length ?? 0} real events loaded in this league, but none match the active filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterLight("ALL");
              setOnlyPositiveEV(false);
              setSearchQuery("");
            }}
            className="mt-3 rounded bg-sb-blue px-3.5 py-1.5 text-xs font-bold text-white hover:bg-sb-blue-hover"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {groupedByLeague.map(([groupKey, group]) => {
            const isCollapsed = !!collapsedLeagues[groupKey];
            return (
              <section
                key={groupKey}
                className="overflow-hidden rounded-lg border border-sb-border bg-sb-panel"
              >
                {/* Cabecera de Liga Estilo Playdoit / Altenar */}
                <div className="flex items-center justify-between border-b border-sb-border bg-sb-header px-3 py-2">
                  <button
                    type="button"
                    onClick={() => toggleLeagueCollapse(groupKey)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span className="text-blue-400">
                      {getSportIcon(group.sportKey, "h-3.5 w-3.5")}
                    </span>
                    <span className="truncate text-xs font-bold uppercase tracking-wide text-slate-200">
                      <span className="text-slate-400">
                        {group.categoryLabel}
                      </span>
                      <span className="mx-1.5 text-slate-600">•</span>
                      <span>{group.league}</span>
                    </span>
                    <span className="rounded bg-sb-surface px-1.5 py-0.2 font-mono text-[10px] font-semibold text-slate-400 tabular-nums">
                      {group.matches.length}
                    </span>
                    <span className="text-slate-500">
                      {isCollapsed ? (
                        <IconChevronRight className="h-3.5 w-3.5" />
                      ) : (
                        <IconChevronDown className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </button>

                  {/* Encabezados de Columna 1 - X - 2 alineados con las celdas de MatchRow */}
                  {!isCollapsed && (
                    <div className="hidden items-center gap-1.5 sm:flex">
                      <div
                        className={`grid gap-1.5 text-center font-mono text-[10px] font-bold uppercase text-slate-400 ${
                          group.is3Way
                            ? "w-[312px] grid-cols-3"
                            : "w-[312px] grid-cols-2"
                        }`}
                      >
                        <span>1 (Home)</span>
                        {group.is3Way && <span>X (Draw)</span>}
                        <span>2 (Away)</span>
                      </div>
                      <div className="w-8" />
                    </div>
                  )}
                </div>

                {/* Filas de Partidos */}
                {!isCollapsed && (
                  <div>
                    {group.matches.map((match) => (
                      <MatchRow key={match.match_id} match={match} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
