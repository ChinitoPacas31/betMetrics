"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBetting } from "@/context/BettingContext";
import { ApiClientError, syncOddsCache } from "@/lib/api";
import { formatMoney } from "@/lib/oddsUtils";
import {
  IconBolt,
  IconCalculator,
  IconCheck,
  IconClose,
  IconHistory,
  IconRefresh,
  IconWallet,
} from "./Icons";

export default function Navbar() {
  const pathname = usePathname();
  const {
    oddsFormat,
    setOddsFormat,
    sportsCatalog,
    activeSport,
    startingBankroll,
    availableBankroll,
    pendingRisk,
    realizedPnL,
    roiPercentage,
    updateStartingBankroll,
    resetBankrollAndHistory,
    paperBets,
  } = useBetting();

  const [bankPopoverOpen, setBankPopoverOpen] = useState(false);
  const [bankInput, setBankInput] = useState(String(startingBankroll));
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: "ok" | "warn" | "err";
    text: string;
  } | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBankInput(String(startingBankroll));
  }, [startingBankroll]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setBankPopoverOpen(false);
      }
    }
    if (bankPopoverOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [bankPopoverOpen]);

  const pendingCount = paperBets.filter((b) => b.status === "PENDING").length;
  const activeSportTitle =
    sportsCatalog.find((s) => s.sport_key === activeSport)?.title ||
    activeSport;

  async function handleAdminSync(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSport) {
      setSyncFeedback({
        type: "err",
        text: "Please select an active league before syncing.",
      });
      return;
    }

    setSyncLoading(true);
    setSyncFeedback(null);
    try {
      const res = await syncOddsCache(activeSport, adminToken, true);
      if (res.source === "redis_stale_429") {
        setSyncFeedback({
          type: "warn",
          text: `RapidAPI returned HTTP 429 (quota exceeded). Preserved the latest real snapshot in Redis for ${res.sport} (${res.synced_matches} events).`,
        });
      } else if (res.source.startsWith("redis_stale")) {
        setSyncFeedback({
          type: "warn",
          text: `Provider temporarily unreachable. Preserved the real backup in Redis for ${res.sport} (${res.synced_matches} events).`,
        });
      } else {
        setSyncFeedback({
          type: "ok",
          text: `Synced live (${res.sport}): ${res.synced_matches} real events from ${res.source}.`,
        });
      }
      window.dispatchEvent(new CustomEvent("betmetrics:odds-synced"));
    } catch (err) {
      if (err instanceof ApiClientError) {
        setSyncFeedback({
          type: "err",
          text: `HTTP ${err.status}: ${err.payload.message}`,
        });
      } else {
        setSyncFeedback({
          type: "err",
          text: "Could not connect to the microservice on port 8000.",
        });
      }
    } finally {
      setSyncLoading(false);
    }
  }

  const navItems = [
    {
      href: "/",
      label: "Sportsbook",
      icon: <IconBolt className="h-3.5 w-3.5" />,
    },
    {
      href: "/bets",
      label: "My Bets",
      icon: <IconHistory className="h-3.5 w-3.5" />,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      href: "/calculator",
      label: "Calculator",
      icon: <IconCalculator className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 h-14 border-b border-sb-border bg-sb-header/95 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1640px] items-center justify-between gap-3 px-3 sm:px-5">
          {/* Izquierda: Identidad Oficial (Isotipo BM + Wordmark BetMetrics) + Navegación */}
          <div className="flex items-center gap-4 lg:gap-7">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5 transition hover:opacity-90"
            >
              <img
                src="/logo.png"
                alt="BetMetrics Logo"
                width={49}
                height={32}
                className="h-7 w-auto object-contain sm:h-8"
              />
              <img
                src="/letras.png"
                alt="BetMetrics"
                width={138}
                height={22}
                className="h-[18px] w-auto object-contain sm:h-[22px]"
              />
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-sb-blue/15 text-blue-400 ring-1 ring-blue-500/35"
                        : "text-slate-300 hover:bg-sb-surface hover:text-white"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ml-0.5 rounded-full bg-sb-blue px-1.5 py-0.2 font-mono text-[10px] font-bold text-white tabular-nums">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Derecha: Switch Momios + Bankroll + Admin Sync */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Selector formato de momios (Decimal vs Americano estilo México) */}
            <div
              className="flex items-center rounded-md border border-sb-border bg-sb-canvas p-0.5"
              title="Switch odds format (Decimal / American)"
            >
              <button
                type="button"
                onClick={() => setOddsFormat("DECIMAL")}
                className={`rounded px-2 py-1 font-mono text-[11px] font-bold transition ${
                  oddsFormat === "DECIMAL"
                    ? "bg-sb-blue text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                DEC
              </button>
              <button
                type="button"
                onClick={() => setOddsFormat("AMERICAN")}
                className={`rounded px-2 py-1 font-mono text-[11px] font-bold transition ${
                  oddsFormat === "AMERICAN"
                    ? "bg-sb-blue text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                US
              </button>
            </div>

            {/* Botón Sincronización Admin */}
            {/* <button
              type="button"
              onClick={() => {
                setSyncFeedback(null);
                setSyncModalOpen(true);
              }}
              className="hidden items-center gap-1.5 rounded-md border border-sb-border bg-sb-panel px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-sb-border-light hover:bg-sb-surface hover:text-white sm:flex"
              title="Sync Redis cache with RapidAPI"
            >
              <IconRefresh className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden lg:inline">Sync API</span>
            </button> */}

            {/* Bankroll Virtual Interactivo */}
            <div className="relative" ref={popoverRef}>
              <button
                type="button"
                onClick={() => setBankPopoverOpen((o) => !o)}
                className="flex items-center gap-2 rounded-md border border-sb-border bg-sb-panel px-2.5 py-1.5 text-left transition hover:border-blue-500/50 hover:bg-sb-surface"
              >
                <IconWallet className="h-4 w-4 text-blue-400" />
                <div className="leading-tight">
                  <div className="hidden text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:block">
                    Paper Balance
                  </div>
                  <div className="font-mono text-xs font-bold text-white tabular-nums">
                    {formatMoney(availableBankroll)}
                  </div>
                </div>
              </button>

              {bankPopoverOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-lg border border-sb-border-light bg-sb-panel p-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-sb-border pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Bankroll Management
                    </span>
                    <button
                      type="button"
                      onClick={() => setBankPopoverOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <IconClose className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded border border-sb-border bg-sb-canvas p-2">
                      <span className="text-[10px] text-slate-400">
                        Available
                      </span>
                      <p className="mt-0.5 font-mono font-bold text-white tabular-nums">
                        {formatMoney(availableBankroll)}
                      </p>
                    </div>
                    <div className="rounded border border-sb-border bg-sb-canvas p-2">
                      <span className="text-[10px] text-slate-400">
                        In Play
                      </span>
                      <p className="mt-0.5 font-mono font-bold text-blue-400 tabular-nums">
                        {formatMoney(pendingRisk)}
                      </p>
                    </div>
                    <div className="rounded border border-sb-border bg-sb-canvas p-2">
                      <span className="text-[10px] text-slate-400">
                        Net P&amp;L
                      </span>
                      <p
                        className={`mt-0.5 font-mono font-bold tabular-nums ${
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
                    <div className="rounded border border-sb-border bg-sb-canvas p-2">
                      <span className="text-[10px] text-slate-400">
                        Settled ROI
                      </span>
                      <p
                        className={`mt-0.5 font-mono font-bold tabular-nums ${
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
                  </div>

                  <div className="mt-3 border-t border-sb-border pt-3">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Starting Bankroll ($)
                    </label>
                    <div className="mt-1 flex gap-1.5">
                      <input
                        type="number"
                        min={100}
                        step={100}
                        value={bankInput}
                        onChange={(e) => setBankInput(e.target.value)}
                        className="w-full rounded border border-sb-border bg-sb-canvas px-2.5 py-1.5 font-mono text-xs text-white focus:border-sb-blue focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateStartingBankroll(Number(bankInput));
                          setBankPopoverOpen(false);
                        }}
                        className="rounded bg-sb-blue px-3 py-1.5 text-xs font-bold text-white hover:bg-sb-blue-hover"
                      >
                        Set
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        resetBankrollAndHistory(10000);
                        setBankPopoverOpen(false);
                      }}
                      className="mt-2.5 w-full rounded border border-rose-500/30 bg-rose-500/10 py-1.5 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/20"
                    >
                      Reset Bankroll ($10,000) &amp; History
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sub-navegación compacta para móviles (< md) */}
        <div className="flex border-t border-sb-border bg-sb-header px-2 py-1 md:hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 text-[11px] font-semibold ${
                  isActive
                    ? "bg-sb-blue/15 text-blue-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="rounded-full bg-sb-blue px-1.5 font-mono text-[10px] text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Modal de Sincronización Administrativa (POST /api/v1/admin/sync-odds) */}
      {syncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-sb-border-light bg-sb-panel p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sb-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Sync Redis Cache (Admin)
                </h3>
                <p className="text-xs text-slate-400">
                  Invalidates the current fresh key and queries RapidAPI live
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSyncModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAdminSync} className="mt-4 space-y-3">
              <div className="rounded border border-sb-border bg-sb-canvas px-3 py-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Selected League
                </span>
                <p className="mt-0.5 font-mono font-semibold text-blue-400">
                  {activeSport
                    ? `${activeSportTitle} (${activeSport})`
                    : "No league loaded"}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  Admin Bearer Token
                </label>
                <input
                  type="password"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                  placeholder="Enter your API_SECRET_TOKEN from .env"
                  required
                  className="mt-1 w-full rounded border border-sb-border bg-sb-canvas px-3 py-2 font-mono text-xs text-white placeholder-slate-500 focus:border-sb-blue focus:outline-none"
                />
              </div>

              {syncFeedback && (
                <div
                  className={`flex items-start gap-2 rounded border p-2.5 text-xs ${
                    syncFeedback.type === "ok"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : syncFeedback.type === "warn"
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                      : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                  }`}
                >
                  {syncFeedback.type === "ok" && (
                    <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  )}
                  <span>{syncFeedback.text}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSyncModalOpen(false)}
                  className="rounded border border-sb-border px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-sb-surface"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={syncLoading || !activeSport || !adminToken.trim()}
                  className="flex items-center gap-1.5 rounded bg-sb-blue px-4 py-2 text-xs font-bold text-white hover:bg-sb-blue-hover disabled:opacity-50"
                >
                  <IconRefresh
                    className={`h-3.5 w-3.5 ${
                      syncLoading ? "animate-spin" : ""
                    }`}
                  />
                  <span>
                    {syncLoading ? "Syncing..." : "Force Sync"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
