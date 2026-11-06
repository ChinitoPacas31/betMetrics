export type TrafficLightColor = "GREEN" | "YELLOW" | "RED";
export type OddsFormat = "DECIMAL" | "AMERICAN";
export type BetSettlementStatus = "PENDING" | "WON" | "LOST" | "PUSH";

export interface EVCalculationRequest {
  match_name?: string;
  decimal_odds: number;
  true_probability: number;
  stake: number;
}

export interface EVCalculationResponse {
  match_name: string;
  decimal_odds: number;
  true_probability: number;
  implied_probability: number;
  stake: number;
  potential_profit: number;
  expected_value: number;
  ev_percentage: number;
  traffic_light: TrafficLightColor;
  recommendation: string;
}

export interface MarketOutcomeEVItem {
  key: string; // "1" | "X" | "2"
  selection: string;
  bookmaker: string;
  decimal_odds: number;
  implied_probability: number;
  true_probability: number;
  stake: number;
  potential_profit: number;
  expected_value: number;
  ev_percentage: number;
  traffic_light: TrafficLightColor;
  recommendation: string;
}

export interface MatchOddsEVItem {
  match_id: string;
  sport_key: string;
  league: string;
  country?: string;
  market_type?: "h2h_3way" | "h2h_2way" | string;
  bookmakers_count?: number;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmaker: string;
  selection: string;
  decimal_odds: number;
  implied_probability: number;
  true_probability: number;
  stake: number;
  potential_profit: number;
  expected_value: number;
  ev_percentage: number;
  traffic_light: TrafficLightColor;
  recommendation: string;
  outcomes?: MarketOutcomeEVItem[];
}

export interface OddsEVListResponse {
  sport: string;
  cached: boolean;
  source: string;
  count: number;
  timestamp: string;
  items: MatchOddsEVItem[];
}

export interface SportCatalogItem {
  sport_key: string;
  title: string;
  category: string;
  country: string;
  market_type: string;
}

export interface SyncOddsResponse {
  status: string;
  sport: string;
  cache_invalidated: boolean;
  synced_matches: number;
  source: string;
  timestamp: string;
}

export interface SlipSelection {
  matchId: string;
  matchName: string;
  league: string;
  sportKey: string;
  commenceTime: string;
  outcomeKey: string;
  selection: string;
  bookmaker: string;
  decimalOdds: number;
  consensusProbability: number;
}

export interface PaperBetRecord {
  id: string;
  placedAt: string;
  settledAt?: string;
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
  status: BetSettlementStatus;
}

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  starting_bankroll: number;
  odds_format: OddsFormat;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  display_name: string;
}

export interface UpdateProfilePayload {
  display_name?: string;
  starting_bankroll?: number;
  odds_format?: OddsFormat;
}

export interface PaperBetApiRecord {
  id: string;
  placed_at: string;
  settled_at: string | null;
  match_id: string;
  match_name: string;
  league: string;
  selection: string;
  outcome_key: string;
  bookmaker: string;
  decimal_odds: number;
  implied_probability: number;
  true_probability: number;
  stake: number;
  potential_profit: number;
  expected_value: number;
  ev_percentage: number;
  traffic_light: TrafficLightColor;
  status: BetSettlementStatus;
}

export interface PaperBetCreatePayload {
  match_id: string;
  match_name: string;
  league: string;
  selection: string;
  outcome_key: string;
  bookmaker: string;
  decimal_odds: number;
  true_probability: number;
  stake: number;
}

export interface ApiErrorPayload {
  error: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}
