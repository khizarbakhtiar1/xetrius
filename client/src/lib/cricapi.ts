/**
 * CricAPI integration layer (server-only).
 *
 * Free tier: 100 requests/day at https://api.cricapi.com/v1/
 * We cache responses in-memory with a 5-minute TTL to stay well within quota.
 * If the API key is missing or the API is unreachable, all functions return null
 * so callers can fall back to the static schedule.
 */

import { logger } from "./logger";

const BASE_URL = "https://api.cricapi.com/v1";
const PSL_SERIES_ID = "9aede005-627e-47d9-8cad-088c8f5585d7";
const CACHE_TTL_MS = 5 * 60 * 1000;

function getApiKey(): string | null {
  const key = process.env.CRICAPI_KEY;
  return key && key.length > 0 ? key : null;
}

// ── Cache ────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

// ── Types ────────────────────────────────────────────────────────────

export interface CricApiTeamInfo {
  name: string;
  shortname: string;
  img: string;
}

export interface CricApiScore {
  r: number;
  w: number;
  o: number;
  inning: string;
}

export interface CricApiMatch {
  id: string;
  name: string;
  matchType: string;
  status: string;
  venue: string;
  date: string;
  dateTimeGMT: string;
  teams: string[];
  teamInfo: CricApiTeamInfo[];
  score: CricApiScore[];
  series_id: string;
  fantasyEnabled: boolean;
  bbbEnabled: boolean;
  hasSquad: boolean;
  matchStarted: boolean;
  matchEnded: boolean;
  tpiTemplate?: string;
}

export interface CricApiResponse<T> {
  apikey: string;
  data: T;
  status: string;
  info: {
    hitsToday: number;
    hitsUsed: number;
    hitsLimit: number;
    credits: number;
    server: number;
    offsetRows: number;
    totalRows: number;
    queryTime: number;
    s: number;
    cache: number;
  };
}

// ── Fetch helpers ────────────────────────────────────────────────────

async function apiFetch<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("apikey", apiKey);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      logger.warn("CricAPI request failed", { endpoint, status: res.status });
      return null;
    }
    const json = (await res.json()) as CricApiResponse<T>;
    if (json.status !== "success") {
      logger.warn("CricAPI non-success", { endpoint, status: json.status });
      return null;
    }
    return json.data;
  } catch (err) {
    logger.warn("CricAPI fetch error", {
      endpoint,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Fetch current/recent matches. CricAPI returns all current matches across
 * cricket; we filter to PSL series.
 */
export async function fetchCurrentMatches(): Promise<CricApiMatch[] | null> {
  const cacheKey = "currentMatches";
  const cached = getCached<CricApiMatch[]>(cacheKey);
  if (cached) return cached;

  const data = await apiFetch<CricApiMatch[]>("currentMatches", { offset: "0" });
  if (!data) return null;

  const pslMatches = data.filter((m) => m.series_id === PSL_SERIES_ID);
  setCache(cacheKey, pslMatches);
  return pslMatches;
}

/**
 * Fetch full series info for PSL 2026.
 */
export async function fetchSeriesInfo(): Promise<CricApiMatch[] | null> {
  const cacheKey = "seriesInfo";
  const cached = getCached<CricApiMatch[]>(cacheKey);
  if (cached) return cached;

  const data = await apiFetch<CricApiMatch[]>("series_info", {
    id: PSL_SERIES_ID,
  });
  if (!data) return null;

  setCache(cacheKey, data);
  return data;
}

/**
 * Fetch detailed scorecard for a specific CricAPI match.
 */
export async function fetchMatchScorecard(
  cricApiMatchId: string
): Promise<CricApiMatch | null> {
  const cacheKey = `scorecard:${cricApiMatchId}`;
  const cached = getCached<CricApiMatch>(cacheKey);
  if (cached) return cached;

  const data = await apiFetch<CricApiMatch>("match_scorecard", {
    id: cricApiMatchId,
  });
  if (!data) return null;

  setCache(cacheKey, data);
  return data;
}

/**
 * Map CricAPI team shortname to our internal shortName.
 */
const TEAM_MAP: Record<string, string> = {
  ISL: "ISU",
  ISU: "ISU",
  LHQ: "LQ",
  LQ: "LQ",
  KRK: "KK",
  KK: "KK",
  PSZ: "PZ",
  PZ: "PZ",
  QTG: "QG",
  QG: "QG",
  MLS: "MS",
  MS: "MS",
  RPZ: "RPZ",
  RWP: "RPZ",
  HYK: "HK",
  HK: "HK",
};

export function mapTeamCode(cricApiCode: string): string {
  return TEAM_MAP[cricApiCode] ?? cricApiCode;
}

/**
 * Format a CricAPI score object into a readable string like "185/4 (18.2)".
 */
export function formatScore(s: CricApiScore): string {
  return `${s.r}/${s.w} (${s.o})`;
}
