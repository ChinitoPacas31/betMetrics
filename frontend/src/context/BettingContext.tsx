"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/context/AuthContext";
import {
  ApiClientError,
  createPaperBet,
  deleteAllPaperBets,
  deletePaperBet as deletePaperBetRequest,
  fetchPaperBets,
  fetchSportsCatalog,
  updatePaperBetStatus,
} from "@/lib/api";
import {
  BetSettlementStatus,
  OddsFormat,
  PaperBetApiRecord,
  PaperBetRecord,
  SlipSelection,
  SportCatalogItem,
  TrafficLightColor,
} from "@/types";

const STORAGE_KEYS = {
  ACTIVE_SPORT: "betmetrics_active_sport_v1",
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
  betsLoading: boolean;
  betsError: string | null;
  placePaperBet: (bet: PlaceBetInput) => Promise<PaperBetRecord>;
  settlePaperBet: (id: string, status: BetSettlementStatus) => Promise<void>;
  deletePaperBet: (id: string) => Promise<void>;
}

const BettingContext = createContext<BettingContextValue | undefined>(undefined);

function mapPaperBet(record: PaperBetApiRecord): PaperBetRecord {
  return {
    id: record.id,
    placedAt: record.placed_at,
    settledAt: record.settled_at || undefined,
    matchId: record.match_id,
    matchName: record.match_name,
    league: record.league,
    selection: record.selection,
    outcomeKey: record.outcome_key,
    bookmaker: record.bookmaker,
    decimalOdds: record.decimal_odds,
    impliedProbability: record.implied_probability,
    trueProbability: record.true_probability,
    stake: record.stake,
    potentialProfit: record.potential_profit,
    expectedValue: record.expected_value,
    evPercentage: record.ev_percentage,
    trafficLight: record.traffic_light,
    status: record.status,
  };
}

function requestErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.payload.message;
  }
  return "Could not sync your paper bets with the backend.";
}

export function BettingProvider({ children }: { children: React.ReactNode }) {
  const { user, updateProfile, refreshUser } = useAuth();

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
  const [betsLoading, setBetsLoading] = useState<boolean>(false);
  const [betsError, setBetsError] = useState<string | null>(null);
  const [activeSlip, setActiveSlip] = useState<SlipSelection | null>(null);
  const [mobileSlipOpen, setMobileSlipOpen] = useState<boolean>(false);

  // Sincroniza las preferencias y el bankroll que viven en PostgreSQL.
  useEffect(() => {
    if (!user) return;
    setStartingBankroll(Number(user.starting_bankroll));
    setOddsFormatState(user.odds_format);
  }, [user?.id, user?.starting_bankroll, user?.odds_format]);

  // Carga el historial del usuario autenticado desde GET /api/v1/bets.
  useEffect(() => {
    if (!user) {
      setPaperBets([]);
      return;
    }

    let cancelled = false;
    setBetsLoading(true);
    setBetsError(null);

    fetchPaperBets()
      .then((records) => {
        if (!cancelled) setPaperBets(records.map(mapPaperBet));
      })
      .catch((error) => {
        if (!cancelled) setBetsError(requestErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setBetsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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
          : "Could not fetch the active sports catalog from FastAPI."
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

  const setOddsFormat = useCallback(
    (fmt: OddsFormat) => {
      if (fmt === oddsFormat) return;
      const previous = oddsFormat;
      setOddsFormatState(fmt);
      if (!user || user.odds_format === fmt) return;

      updateProfile({ odds_format: fmt }).catch(() => {
        setOddsFormatState(previous);
        setBetsError("Could not save your odds format preference.");
      });
    },
    [oddsFormat, user, updateProfile]
  );

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

  const updateStartingBankroll = useCallback(
    (amount: number) => {
      if (!Number.isFinite(amount) || amount < 100) return;
      const rounded = Math.round(amount * 100) / 100;
      const previous = startingBankroll;
      setStartingBankroll(rounded);

      updateProfile({ starting_bankroll: rounded }).catch(() => {
        setStartingBankroll(previous);
        setBetsError("Could not update your starting bankroll.");
      });
    },
    [startingBankroll, updateProfile]
  );

  const resetBankrollAndHistory = useCallback(
    (amount: number = DEFAULT_STARTING_BANKROLL) => {
      setStartingBankroll(amount);
      setPaperBets([]);
      setActiveSlip(null);
      setBetsError(null);

      void (async () => {
        try {
          await Promise.all([
            updateProfile({ starting_bankroll: amount }),
            deleteAllPaperBets(),
          ]);
        } catch (error) {
          setBetsError(requestErrorMessage(error));
          refreshUser().catch(() => {});
        }
      })();
    },
    [updateProfile, refreshUser]
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

  const placePaperBet = useCallback(
    async (input: PlaceBetInput): Promise<PaperBetRecord> => {
      const created = await createPaperBet({
        match_id: input.matchId,
        match_name: input.matchName,
        league: input.league,
        selection: input.selection,
        outcome_key: input.outcomeKey,
        bookmaker: input.bookmaker,
        decimal_odds: input.decimalOdds,
        true_probability: input.trueProbability,
        stake: input.stake,
      });
      const record = mapPaperBet(created);
      setPaperBets((prev) => [record, ...prev]);
      setBetsError(null);
      return record;
    },
    []
  );

  const settlePaperBet = useCallback(
    async (id: string, status: BetSettlementStatus) => {
      const optimisticSettledAt =
        status === "PENDING" ? undefined : new Date().toISOString();

      setPaperBets((prev) =>
        prev.map((bet) =>
          bet.id === id
            ? { ...bet, status, settledAt: optimisticSettledAt }
            : bet
        )
      );

      try {
        const updated = await updatePaperBetStatus(id, status);
        setPaperBets((prev) =>
          prev.map((bet) => (bet.id === id ? mapPaperBet(updated) : bet))
        );
        setBetsError(null);
      } catch (error) {
        setBetsError(requestErrorMessage(error));
        try {
          const records = await fetchPaperBets();
          setPaperBets(records.map(mapPaperBet));
        } catch {}
      }
    },
    []
  );

  const deletePaperBet = useCallback(async (id: string) => {
    setPaperBets((prev) => prev.filter((bet) => bet.id !== id));
    try {
      await deletePaperBetRequest(id);
      setBetsError(null);
    } catch (error) {
      setBetsError(requestErrorMessage(error));
      try {
        const records = await fetchPaperBets();
        setPaperBets(records.map(mapPaperBet));
      } catch {}
    }
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
      betsLoading,
      betsError,
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
      betsLoading,
      betsError,
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
