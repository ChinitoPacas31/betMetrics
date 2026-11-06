from app.schemas.ev_schemas import (
    EVCalculationRequest,
    EVCalculationResponse,
    TrafficLightColor,
)


class EVCalculatorService:
    """
    Motor matemático aislado para cálculo de Valor Esperado (+EV) y asignación
    estricta del semáforo de confianza:
      - GREEN:  EV% > 3.0%
      - YELLOW: 0.0% <= EV% <= 3.0%
      - RED:    EV% < 0.0%
    """

    @staticmethod
    def assign_traffic_light(ev_percentage: float) -> TrafficLightColor:
        if ev_percentage > 3.0:
            return TrafficLightColor.GREEN
        if 0.0 <= ev_percentage <= 3.0:
            return TrafficLightColor.YELLOW
        return TrafficLightColor.RED

    @staticmethod
    def build_recommendation(traffic_light: TrafficLightColor, ev_percentage: float) -> str:
        if traffic_light == TrafficLightColor.GREEN:
            return f"Strong +EV Opportunity (+{ev_percentage:.2f}%). Favorable statistical edge for Paper Betting."
        if traffic_light == TrafficLightColor.YELLOW:
            return f"Neutral Zone ({ev_percentage:.2f}%). Narrow margin against the bookmaker vigorish."
        return f"High Risk / Negative EV ({ev_percentage:.2f}%). Unfavorable in the long run."

    @classmethod
    def calculate_ev(cls, payload: EVCalculationRequest) -> EVCalculationResponse:
        """
        Implementa la fórmula exacta:
          Profit = Stake * (Decimal_Odds - 1)
          P_loss = 1 - P_win
          EV = (P_win * Profit) - (P_loss * Stake)
          EV% = (EV / Stake) * 100
        """
        p_win = payload.true_probability
        p_loss = 1.0 - p_win
        stake = payload.stake
        decimal_odds = payload.decimal_odds

        profit = stake * (decimal_odds - 1.0)
        expected_value = (p_win * profit) - (p_loss * stake)
        ev_percentage = (expected_value / stake) * 100.0
        implied_probability = 1.0 / decimal_odds

        rounded_ev_pct = round(ev_percentage, 2)
        traffic_light = cls.assign_traffic_light(rounded_ev_pct)
        recommendation = cls.build_recommendation(traffic_light, rounded_ev_pct)

        return EVCalculationResponse(
            match_name=payload.match_name or "Custom Simulation Match",
            decimal_odds=round(decimal_odds, 3),
            true_probability=round(p_win, 4),
            implied_probability=round(implied_probability, 4),
            stake=round(stake, 2),
            potential_profit=round(profit, 2),
            expected_value=round(expected_value, 2),
            ev_percentage=rounded_ev_pct,
            traffic_light=traffic_light,
            recommendation=recommendation,
        )

