export type TrafficLightColor = "GREEN" | "YELLOW" | "RED";

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

export interface MatchOddsEVItem {
  match_id: string;
  sport_key: string;
  league: string;
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
}

export interface OddsEVListResponse {
  sport: string;
  cached: boolean;
  source: string;
  count: number;
  timestamp: string;
  items: MatchOddsEVItem[];
}

export interface ApiErrorPayload {
  error: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

