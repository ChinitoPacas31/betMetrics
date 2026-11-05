"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchSportsCatalog } from "@/lib/api";
import {
  BetSettlementStatus,
  OddsFormat,
  PaperBetRecord,
  SlipSelection,
  SportCatalogItem,
  TrafficLightColor,
} from "@/types";

const STORAGE_KEYS = {
  ODDS_FORMAT: "betmetrics_odds_format_v1",
  ACTIVE_SPORT: "betmetrics_active_sport_v1",
  STARTING_BANKROLL: "betmetrics_starting_bankroll_v1",
  PAPER_BETS: "betmetrics_paper_bets_v1",
};

const DEFAULT_STARTING_BANKROLL = 10000;

interface PlaceBetInput {
  matchId: string;
  matchName: string;
  league: string;
  selection: string;
  outcomeKey: string;
  bookmaker: string;
  decimalOdds: number;
  impliedProbability: number;
  trueProbability: number;
  stake: number;
  potentialProfit: number;
  expectedValue: number;
  evPercentage: number;
  trafficLight: TrafficLightColor;
}

interface BettingContextValue {
  oddsFormat: OddsFormat;
  setOddsFormat: (fmt: OddsFormat) => void;
  sportsCatalog: SportCatalogItem[];
  sportsLoading: boolean;
  sportsError: string | null;
  reloadSportsCatalog: () => Promise<void>;
  activeSport: string;
  setActiveSport: (sportKey: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onlyPositiveEV: boolean;
  setOnlyPositiveEV: (v: boolean) => void;
  startingBankroll: number;
  availableBankroll: number;
  pendingRisk: number;
  realizedPnL: number;
  roiPercentage: number;
  updateStartingBankroll: (amount: number) => void;
  resetBankrollAndHistory: (amount?: number) => void;
  activeSlip: SlipSelection | null;
  selectOutcomeToSlip: (selection: SlipSelection) => void;
  clearSlip: () => void;
  mobileSlipOpen: boolean;
  setMobileSlipOpen: (open: boolean) => void;
  paperBets: PaperBetRecord[];
  placePaperBet: (bet: PlaceBetInput) => PaperBetRecord;
  settlePaperBet: (id: string, status: BetSettlementStatus) => void;
  deletePaperBet: (id: string) => void;
}

const BettingContext = createContext<BettingContextValue | undefined>(undefined);

export function BettingProvider({ children }: { children: React.ReactNode }) {
  const [oddsFormat, setOddsFormatState] = useState<OddsFormat>("DECIMAL");
  const [sportsCatalog, setSportsCatalog] = useState<SportCatalogItem[]>([]);
  const [sportsLoading, setSportsLoading] = useState<boolean>(true);
  const [sportsError, setSportsError] = useState<string | null>(null);
  const [activeSport, setActiveSportState] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [onlyPositiveEV, setOnlyPositiveEV] = useState<boolean>(false);

  const [startingBankroll, setStartingBankroll] = useState<number>(
    DEFAULT_STARTING_BANKROLL
  );
  const [paperBets, setPaperBets] = useState<PaperBetRecord[]>([]);
  const [activeSlip, setActiveSlip] = useState<SlipSelection | null>(null);
  const [mobileSlipOpen, setMobileSlipOpen] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(false);

  // Hidratación desde localStorage al montar
  useEffect(() => {
    try {
      const savedFmt = localStorage.getItem(STORAGE_KEYS.ODDS_FORMAT);
      if (savedFmt === "AMERICAN" || savedFmt === "DECIMAL") {
        setOddsFormatState(savedFmt);
      }
      const savedBank = localStorage.getItem(STORAGE_KEYS.STARTING_BANKROLL);
      if (savedBank) {
        const parsed = Number(savedBank);
        if (Number.isFinite(parsed) && parsed > 0) {
          setStartingBankroll(parsed);
        }
      }
      const savedBets = localStorage.getItem(STORAGE_KEYS.PAPER_BETS);
      if (savedBets) {
        const parsedBets = JSON.parse(savedBets);
        if (Array.isArray(parsedBets)) {
          setPaperBets(parsedBets);
        }
      }
    } catch {
      // Ignora bloqueos de almacenamiento privado
    } finally {
      setHydrated(true);
    }
  }, []);

  // Carga 100% dinámica de deportes activos desde GET /api/v1/odds/sports
  const reloadSportsCatalog = useCallback(async () => {
    setSportsLoading(true);
    setSportsError(null);
    try {
      const catalog = await fetchSportsCatalog();
      setSportsCatalog(catalog);

      if (catalog.length > 0) {
        let savedSport = "";
        try {
          savedSport = localStorage.getItem(STORAGE_KEYS.ACTIVE_SPORT) || "";
        } catch {}

        setActiveSportState((current) => {
          if (current && catalog.some((item) => item.sport_key === current)) {
            return current;
          }
          if (
            savedSport &&
            catalog.some((item) => item.sport_key === savedSport)
          ) {
            return savedSport;
          }
          return catalog[0].sport_key;
        });
      }
    } catch (err) {
      setSportsError(
        err instanceof Error
          ? err.message
          : "No se pudo consultar el catálogo de deportes activos en FastAPI."
      );
    } finally {
      setSportsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadSportsCatalog();
  }, [reloadSportsCatalog]);

  const setActiveSport = useCallback((sportKey: string) => {
    setActiveSportState(sportKey);
    try {
      if (sportKey) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SPORT, sportKey);
      }
    } catch {}
  }, []);

  // Persistencia reactiva en localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.ODDS_FORMAT, oddsFormat);
    } catch {}
  }, [oddsFormat, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEYS.STARTING_BANKROLL,
        String(startingBankroll)
      );
    } catch {}
  }, [startingBankroll, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PAPER_BETS, JSON.stringify(paperBets));
    } catch {}
  }, [paperBets, hydrated]);

  const setOddsFormat = useCallback((fmt: OddsFormat) => {
    setOddsFormatState(fmt);
  }, []);

  const { pendingRisk, realizedPnL, settledVolume } = useMemo(() => {
    let pending = 0;
    let pnl = 0;
    let volume = 0;

    for (const bet of paperBets) {
      if (bet.status === "PENDING") {
        pending += bet.stake;
      } else if (bet.status === "WON") {
        pnl += bet.potentialProfit;
        volume += bet.stake;
      } else if (bet.status === "LOST") {
        pnl -= bet.stake;
        volume += bet.stake;
      } else if (bet.status === "PUSH") {
        volume += bet.stake;
      }
    }

    return {
      pendingRisk: Number(pending.toFixed(2)),
      realizedPnL: Number(pnl.toFixed(2)),
      settledVolume: volume,
    };
  }, [paperBets]);

  const availableBankroll = useMemo(() => {
    return Number((startingBankroll + realizedPnL - pendingRisk).toFixed(2));
  }, [startingBankroll, realizedPnL, pendingRisk]);

  const roiPercentage = useMemo(() => {
    if (settledVolume <= 0) return 0;
    return Number(((realizedPnL / settledVolume) * 100).toFixed(2));
  }, [realizedPnL, settledVolume]);

  const updateStartingBankroll = useCallback((amount: number) => {
    if (Number.isFinite(amount) && amount >= 100) {
      setStartingBankroll(Math.round(amount * 100) / 100);
    }
  }, []);

  const resetBankrollAndHistory = useCallback(
    (amount: number = DEFAULT_STARTING_BANKROLL) => {
      setStartingBankroll(amount);
      setPaperBets([]);
      setActiveSlip(null);
    },
    []
  );

  const selectOutcomeToSlip = useCallback((selection: SlipSelection) => {
    setActiveSlip((prev) => {
      if (
        prev &&
        prev.matchId === selection.matchId &&
        prev.outcomeKey === selection.outcomeKey
      ) {
        return null;
      }
      return selection;
    });
  }, []);

  const clearSlip = useCallback(() => {
    setActiveSlip(null);
  }, []);

  const placePaperBet = useCallback((input: PlaceBetInput): PaperBetRecord => {
    const newRecord: PaperBetRecord = {
      id: `pb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      placedAt: new Date().toISOString(),
      matchId: input.matchId,
      matchName: input.matchName,
      league: input.league,
      selection: input.selection,
      outcomeKey: input.outcomeKey,
      bookmaker: input.bookmaker,
      decimalOdds: input.decimalOdds,
      impliedProbability: input.impliedProbability,
      trueProbability: input.trueProbability,
      stake: input.stake,
      potentialProfit: input.potentialProfit,
      expectedValue: input.expectedValue,
      evPercentage: input.evPercentage,
      trafficLight: input.trafficLight,
      status: "PENDING",
    };
    setPaperBets((prev) => [newRecord, ...prev]);
    return newRecord;
  }, []);

  const settlePaperBet = useCallback(
    (id: string, status: BetSettlementStatus) => {
      setPaperBets((prev) =>
        prev.map((bet) =>
          bet.id === id
            ? {
                ...bet,
                status,
                settledAt:
                  status === "PENDING" ? undefined : new Date().toISOString(),
              }
            : bet
        )
      );
    },
    []
  );

  const deletePaperBet = useCallback((id: string) => {
    setPaperBets((prev) => prev.filter((bet) => bet.id !== id));
  }, []);

  const value = useMemo<BettingContextValue>(
    () => ({
      oddsFormat,
      setOddsFormat,
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
      startingBankroll,
      availableBankroll,
      pendingRisk,
      realizedPnL,
      roiPercentage,
      updateStartingBankroll,
      resetBankrollAndHistory,
      activeSlip,
      selectOutcomeToSlip,
      clearSlip,
      mobileSlipOpen,
      setMobileSlipOpen,
      paperBets,
      placePaperBet,
      settlePaperBet,
      deletePaperBet,
    }),
    [
      oddsFormat,
      setOddsFormat,
      sportsCatalog,
      sportsLoading,
      sportsError,
      reloadSportsCatalog,
      activeSport,
      setActiveSport,
      searchQuery,
      onlyPositiveEV,
      startingBankroll,
      availableBankroll,
      pendingRisk,
      realizedPnL,
      roiPercentage,
      updateStartingBankroll,
      resetBankrollAndHistory,
      activeSlip,
      selectOutcomeToSlip,
      clearSlip,
      mobileSlipOpen,
      paperBets,
      placePaperBet,
      settlePaperBet,
      deletePaperBet,
    ]
  );

  return (
    <BettingContext.Provider value={value}>{children}</BettingContext.Provider>
  );
}

export function useBetting() {
  const ctx = useContext(BettingContext);
  if (!ctx) {
    throw new Error("useBetting must be used within a BettingProvider");
  }
  return ctx;
}
