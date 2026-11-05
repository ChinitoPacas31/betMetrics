"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useBetting } from "@/context/BettingContext";
import { SportCatalogItem } from "@/types";
import {
  getSportIcon,
  IconBolt,
  IconChevronDown,
  IconChevronRight,
  IconClose,
  IconRefresh,
  IconSearch,
} from "./Icons";

export default function SportsSidebar() {
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

  const [leagueFilter, setLeagueFilter] = useState<string>("");
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    {}
  );

  // Agrupación 100% dinámica por categoría devuelta en vivo por RapidAPI (/v4/sports)
  const groupedCategories = useMemo(() => {
    const q = leagueFilter.trim().toLowerCase();
    const map = new Map<string, SportCatalogItem[]>();

    for (const item of sportsCatalog) {
      if (q) {
        const matchText = `${item.title} ${item.category} ${item.country} ${item.sport_key}`.toLowerCase();
        if (!matchText.includes(q)) continue;
      }
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }

    return Array.from(map.entries());
  }, [sportsCatalog, leagueFilter]);

  // Expandir automáticamente la categoría del deporte activo y las primeras dos al cargar
  useEffect(() => {
    if (sportsCatalog.length === 0) return;
    setOpenCategories((prev) => {
      const next = { ...prev };
      const activeItem = sportsCatalog.find((s) => s.sport_key === activeSport);
      if (activeItem && next[activeItem.category] === undefined) {
        next[activeItem.category] = true;
      }
      const uniqueCategories = Array.from(
        new Set(sportsCatalog.map((s) => s.category))
      );
      uniqueCategories.slice(0, 2).forEach((cat) => {
        if (next[cat] === undefined) {
          next[cat] = true;
        }
      });
      return next;
    });
  }, [sportsCatalog, activeSport]);

  function toggleCategory(cat: string) {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-[72px] max-h-[calc(100vh-88px)] space-y-3 overflow-y-auto pr-1">
        {/* Buscador Rápido de Partidos + Switch Sharp +EV */}
        <div className="rounded-lg border border-sb-border bg-sb-panel p-2.5">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar equipos en pantalla..."
              className="w-full rounded border border-sb-border bg-sb-canvas py-1.5 pl-8 pr-7 text-xs text-white placeholder-slate-500 focus:border-sb-blue focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-slate-400 hover:text-white"
              >
                <IconClose className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOnlyPositiveEV(!onlyPositiveEV)}
            className={`mt-2 flex w-full items-center justify-between rounded border px-2.5 py-2 text-xs font-semibold transition ${
              onlyPositiveEV
                ? "border-blue-500/50 bg-sb-blue/15 text-blue-300"
                : "border-sb-border bg-sb-surface text-slate-300 hover:border-sb-border-light hover:text-white"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <IconBolt
                className={`h-3.5 w-3.5 ${
                  onlyPositiveEV ? "text-blue-400" : "text-emerald-400"
                }`}
              />
              <span>Solo Valor +EV (&gt;3%)</span>
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                onlyPositiveEV ? "bg-blue-400" : "bg-slate-600"
              }`}
            />
          </button>
        </div>

        {/* Catálogo Dinámico Real desde RapidAPI (/v4/sports) */}
        <div className="overflow-hidden rounded-lg border border-sb-border bg-sb-panel">
          <div className="flex items-center justify-between border-b border-sb-border bg-sb-header px-3 py-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ligas Activas ({sportsCatalog.length})
            </h2>
            <button
              type="button"
              onClick={reloadSportsCatalog}
              disabled={sportsLoading}
              title="Recargar catálogo de deportes desde RapidAPI"
              className="text-slate-400 transition hover:text-blue-400 disabled:opacity-50"
            >
              <IconRefresh
                className={`h-3.5 w-3.5 ${sportsLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {/* Buscador de Ligas dentro del Catálogo */}
          {sportsCatalog.length > 6 && (
            <div className="border-b border-sb-border/70 p-2">
              <input
                type="text"
                value={leagueFilter}
                onChange={(e) => setLeagueFilter(e.target.value)}
                placeholder="Buscar liga o deporte..."
                className="w-full rounded border border-sb-border bg-sb-canvas px-2.5 py-1 text-[11px] text-white placeholder-slate-500 focus:border-sb-blue focus:outline-none"
              />
            </div>
          )}

          {sportsLoading && sportsCatalog.length === 0 ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className="h-7 animate-pulse rounded bg-sb-odds"
                />
              ))}
            </div>
          ) : sportsError && sportsCatalog.length === 0 ? (
            <div className="space-y-2 p-3 text-xs text-rose-300">
              <p className="font-semibold">Catálogo no disponible</p>
              <p className="text-[11px] text-rose-300/80">{sportsError}</p>
              <button
                type="button"
                onClick={reloadSportsCatalog}
                className="w-full rounded bg-sb-blue py-1.5 text-[11px] font-bold text-white hover:bg-sb-blue-hover"
              >
                Reintentar carga
              </button>
            </div>
          ) : groupedCategories.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              Sin ligas activas para &ldquo;{leagueFilter}&rdquo;.
            </div>
          ) : (
            <div className="divide-y divide-sb-border/60">
              {groupedCategories.map(([category, leagues]) => {
                const isOpen =
                  leagueFilter.trim().length > 0 || !!openCategories[category];
                const sampleSportKey = leagues[0]?.sport_key || "";

                return (
                  <div key={category}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-slate-200 transition hover:bg-sb-surface"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="shrink-0 text-blue-400">
                          {getSportIcon(sampleSportKey, "h-3.5 w-3.5")}
                        </span>
                        <span className="truncate">{category}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 text-slate-500">
                        <span className="rounded bg-sb-canvas px-1.5 py-0.2 font-mono text-[10px] tabular-nums">
                          {leagues.length}
                        </span>
                        {isOpen ? (
                          <IconChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <IconChevronRight className="h-3.5 w-3.5" />
                        )}
                      </span>
                    </button>

                    {isOpen && (
                      <ul className="bg-sb-canvas/60 py-1">
                        {leagues.map((league) => {
                          const isSelected = activeSport === league.sport_key;
                          return (
                            <li key={league.sport_key}>
                              <button
                                type="button"
                                onClick={() => setActiveSport(league.sport_key)}
                                className={`flex w-full items-center justify-between gap-2 border-l-2 py-1.5 pl-7 pr-3 text-left text-xs transition ${
                                  isSelected
                                    ? "border-sb-blue bg-sb-blue/12 font-bold text-blue-400"
                                    : "border-transparent text-slate-400 hover:bg-sb-surface/50 hover:text-white"
                                }`}
                              >
                                <span className="truncate">{league.title}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
