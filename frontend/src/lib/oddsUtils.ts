import { OddsFormat, TrafficLightColor } from "@/types";

/**
 * Convierte cuota decimal (ej. 2.15 o 1.80) a momio americano (+115 o -125).
 */
export function decimalToAmerican(decimalOdds: number): string {
  if (!Number.isFinite(decimalOdds) || decimalOdds <= 1.0) {
    return "-10000";
  }
  if (Math.abs(decimalOdds - 2.0) < 0.001) {
    return "+100";
  }
  if (decimalOdds >= 2.0) {
    const american = Math.round((decimalOdds - 1) * 100);
    return `+${american}`;
  }
  const american = Math.round(-100 / (decimalOdds - 1));
  return `${american}`;
}

/**
 * Convierte momio americano (+150, -110) a cuota decimal (2.50, 1.909).
 */
export function americanToDecimal(americanOdds: number): number {
  if (!Number.isFinite(americanOdds) || americanOdds === 0) {
    return 2.0;
  }
  if (americanOdds > 0) {
    return Number((americanOdds / 100 + 1).toFixed(3));
  }
  return Number((100 / Math.abs(americanOdds) + 1).toFixed(3));
}

/**
 * Formatea una cuota decimal según la preferencia global del usuario (Decimal vs Americano).
 */
export function formatOdds(decimalOdds: number, format: OddsFormat): string {
  if (format === "AMERICAN") {
    return decimalToAmerican(decimalOdds);
  }
  return decimalOdds.toFixed(2);
}

/**
 * Formatea montos monetarios en formato limpio USD/MXN con 2 decimales.
 */
export function formatMoney(amount: number, showSign: boolean = false): string {
  const absFormatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (!showSign) {
    return amount < 0 ? `-$${absFormatted}` : `$${absFormatted}`;
  }
  if (amount > 0) return `+$${absFormatted}`;
  if (amount < 0) return `-$${absFormatted}`;
  return `$${absFormatted}`;
}

export interface LocalEVSnapshot {
  impliedProbability: number;
  potentialProfit: number;
  totalPayout: number;
  expectedValue: number;
  evPercentage: number;
  trafficLight: TrafficLightColor;
  fullKellyFraction: number;
  quarterKellyStake: number;
}

/**
 * Calcula instantáneamente las métricas +EV y Criterio de Kelly en cliente
 * usando exactamente las mismas reglas matemáticas del microservicio FastAPI.
 */
export function computeEVAndKelly(
  decimalOdds: number,
  trueProbability: number,
  stake: number,
  availableBankroll: number
): LocalEVSnapshot {
  const safeOdds = Math.max(decimalOdds, 1.01);
  const pWin = Math.min(Math.max(trueProbability, 0.001), 0.999);
  const pLoss = 1 - pWin;
  const safeStake = Math.max(stake, 0);

  const impliedProbability = 1 / safeOdds;
  const potentialProfit = safeStake * (safeOdds - 1);
  const totalPayout = safeStake + potentialProfit;
  const expectedValue = pWin * potentialProfit - pLoss * safeStake;
  const evPercentage = safeStake > 0 ? (expectedValue / safeStake) * 100 : (pWin * (safeOdds - 1) - pLoss) * 100;
  const roundedEvPct = Number(evPercentage.toFixed(2));

  let trafficLight: TrafficLightColor = "RED";
  if (roundedEvPct > 3.0) {
    trafficLight = "GREEN";
  } else if (roundedEvPct >= 0.0) {
    trafficLight = "YELLOW";
  }

  // Criterio de Kelly: f* = (b*p - q) / b, donde b = decimalOdds - 1
  const b = safeOdds - 1;
  const rawKelly = b > 0 ? (b * pWin - pLoss) / b : 0;
  const fullKellyFraction = Math.max(0, rawKelly);
  // 1/4 Kelly con tope prudencial de 10% del bankroll disponible
  const quarterKellyFraction = Math.min(fullKellyFraction * 0.25, 0.1);
  const quarterKellyStake = Math.max(
    0,
    Math.round(Math.max(availableBankroll, 0) * quarterKellyFraction)
  );

  return {
    impliedProbability,
    potentialProfit,
    totalPayout,
    expectedValue,
    evPercentage: roundedEvPct,
    trafficLight,
    fullKellyFraction,
    quarterKellyStake,
  };
}

