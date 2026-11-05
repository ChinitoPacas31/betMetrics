import {
  ApiErrorPayload,
  EVCalculationRequest,
  EVCalculationResponse,
  OddsEVListResponse,
  SportCatalogItem,
  SyncOddsResponse,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export class ApiClientError extends Error {
  status: number;
  payload: ApiErrorPayload;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message || "Error communicating with BetMetrics microservice");
    this.name = "ApiClientError";
    this.status = status;
    this.payload = payload;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiErrorPayload = {
      error: "HttpError",
      message: `HTTP Error ${response.status}`,
    };
    try {
      errorData = (await response.json()) as ApiErrorPayload;
    } catch {
      // Mantiene estructura segura si el cuerpo no es JSON
    }
    throw new ApiClientError(response.status, errorData);
  }
  return (await response.json()) as T;
}

/**
 * Consume GET /api/v1/odds/ev para obtener las cuotas reales con análisis +EV y semáforo.
 */
export async function fetchOddsEV(
  sport: string,
  stake: number = 100
): Promise<OddsEVListResponse> {
  const params = new URLSearchParams({
    sport,
    stake: stake.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/odds/ev?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  return handleResponse<OddsEVListResponse>(response);
}

/**
 * Consume GET /api/v1/odds/sports para listar dinámicamente el catálogo de deportes activos en RapidAPI.
 */
export async function fetchSportsCatalog(): Promise<SportCatalogItem[]> {
  const response = await fetch(`${API_BASE_URL}/odds/sports`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  return handleResponse<SportCatalogItem[]>(response);
}

/**
 * Consume POST /api/v1/calculations/ev para simular una apuesta manual (Paper Betting).
 */
export async function calculateCustomEV(
  payload: EVCalculationRequest
): Promise<EVCalculationResponse> {
  const response = await fetch(`${API_BASE_URL}/calculations/ev`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<EVCalculationResponse>(response);
}

/**
 * Consume POST /api/v1/admin/sync-odds (protegido con Bearer Token) para invalidar caché fresca en Redis.
 */
export async function syncOddsCache(
  sport: string,
  adminToken: string,
  forceInvalidate: boolean = true
): Promise<SyncOddsResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/sync-odds`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${adminToken.trim()}`,
    },
    body: JSON.stringify({
      sport,
      force_invalidate: forceInvalidate,
    }),
  });

  return handleResponse<SyncOddsResponse>(response);
}
