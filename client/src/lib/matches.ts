import { TEAMS } from "./teams";
import type { PointsTableEntry } from "@/types";

export interface Match {
  matchId: number;
  teamA: string;
  teamB: string;
  venue: string;
  startTime: number;
  status: "upcoming" | "live" | "completed";
  tossWinner: "A" | "B" | null;
  tossDecision?: "bat" | "bowl" | null;
  scoreA?: string;
  scoreB?: string;
  result?: string;
}

export interface MatchWithTeams extends Match {
  teamAFull: (typeof TEAMS)[number] | undefined;
  teamBFull: (typeof TEAMS)[number] | undefined;
}

const CHECK_IN_WINDOW_MS = 6 * 60 * 60 * 1000;

// PKT = UTC+5. Helper: "2026-03-26T19:00" PKT → UTC ms
function pkt(dateStr: string): number {
  return new Date(dateStr + ":00+05:00").getTime();
}

// ── Real PSL 2026 Schedule (44 matches) ─────────────────────────────
// Venues: Lahore = Gaddafi Stadium, Karachi = National Bank Cricket Arena

const REAL_SCHEDULE: Match[] = [
  // ── League stage: Lahore leg (Mar 26 – Apr 7) ─────────────────────
  { matchId: 1,  teamA: "LQ",  teamB: "HK",  venue: "Gaddafi Stadium, Lahore",        startTime: pkt("2026-03-26T19:00"), status: "completed", tossWinner: "A", tossDecision: "bat",  scoreA: "234/5 (20)",   scoreB: "165/10 (18.4)", result: "Lahore Qalandars won by 69 runs" },
  { matchId: 2,  teamA: "QG",  teamB: "KK",  venue: "Gaddafi Stadium, Lahore",        startTime: pkt("2026-03-27T19:00"), status: "completed", tossWinner: "B", tossDecision: "bowl", scoreA: "172/8 (20)",   scoreB: "186/6 (19.2)",  result: "Karachi Kings won by 14 runs" },
  { matchId: 3,  teamA: "PZ",  teamB: "RPZ", venue: "Gaddafi Stadium, Lahore",        startTime: pkt("2026-03-28T14:30"), status: "completed", tossWinner: "A", tossDecision: "bowl", scoreA: "178/4 (18.0)", scoreB: "145/10 (19.1)", result: "Peshawar Zalmi won by 5 wickets" },
  { matchId: 4,  teamA: "MS",  teamB: "ISU", venue: "Gaddafi Stadium, Lahore",        startTime: pkt("2026-03-28T19:00"), status: "completed", tossWinner: "A", tossDecision: "bat",  scoreA: "198/5 (20)",   scoreB: "192/7 (20)",    result: "Multan Sultans won by 5 wickets" },
  { matchId: 5,  teamA: "QG",  teamB: "HK",  venue: "Gaddafi Stadium, Lahore",        startTime: pkt("2026-03-29T14:30"), status: "completed", tossWinner: "A", tossDecision: "bat",  scoreA: "189/6 (20)",   scoreB: "149/10 (18.2)", result: "Quetta Gladiators won by 40 runs" },
  { matchId: 6,  teamA: "LQ",  teamB: "KK",  venue: "Gaddafi Stadium, Lahore",        startTime: pkt("2026-03-29T19:00"), status: "completed", tossWinner: "B", tossDecision: "bowl", scoreA: "157/10 (19.3)", scoreB: "161/4 (17.2)", result: "Karachi Kings won by 6 wickets" },
  { matchId: 7,  teamA: "ISU", teamB: "PZ",  venue: "Gaddafi Stadium, Lahore",        startTime: pkt("2026-03-31T19:00"), status: "completed", tossWinner: "B", tossDecision: "bowl", scoreA: "165/8 (20)",   scoreB: "169/3 (18.0)",  result: "Peshawar Zalmi won by 7 wickets" },
  { matchId: 8,  teamA: "MS",  teamB: "HK",  venue: "Gaddafi Stadium, Lahore",        startTime: pkt("2026-04-01T19:00"), status: "completed", tossWinner: "A", tossDecision: "bat",  scoreA: "210/4 (20)",   scoreB: "178/8 (20)",    result: "Multan Sultans won by 32 runs" },
  { matchId: 9,  teamA: "ISU", teamB: "QG",  venue: "Gaddafi Stadium, Lahore",        startTime: pkt("2026-04-02T14:30"), status: "completed", tossWinner: "A", tossDecision: "bat",  scoreA: "193/5 (20)",   scoreB: "160/10 (19.0)", result: "Islamabad United won by 33 runs" },
  { matchId: 10, teamA: "RPZ", teamB: "KK",  venue: "Gaddafi Stadium, Lahore",        startTime: pkt("2026-04-02T19:00"), status: "completed", tossWinner: "B", tossDecision: "bowl", scoreA: "140/10 (18.4)", scoreB: "141/2 (14.3)", result: "Karachi Kings won by 8 wickets" },
  { matchId: 11, teamA: "MS",  teamB: "LQ",  venue: "Gaddafi Stadium, Lahore",        startTime: pkt("2026-04-03T19:00"), status: "completed", tossWinner: "A", tossDecision: "bat",  scoreA: "214/4 (20)",   scoreB: "154/10 (17.4)", result: "Multan Sultans won by 60 runs" },
  { matchId: 12, teamA: "RPZ", teamB: "ISU", venue: "Gaddafi Stadium, Lahore",        startTime: pkt("2026-04-04T19:00"), status: "completed", tossWinner: "B", tossDecision: "bowl", scoreA: "155/10 (19.2)", scoreB: "159/3 (16.4)", result: "Islamabad United won by 7 wickets" },
  { matchId: 13, teamA: "MS",  teamB: "QG",  venue: "Gaddafi Stadium, Lahore",        startTime: pkt("2026-04-05T19:00"), status: "completed", tossWinner: "B", tossDecision: "bowl", scoreA: "201/5 (20)",   scoreB: "185/8 (20)",    result: "Multan Sultans won by 16 runs" },
  { matchId: 14, teamA: "MS",  teamB: "RPZ", venue: "Gaddafi Stadium, Lahore",        startTime: pkt("2026-04-06T19:00"), status: "completed", tossWinner: "A", tossDecision: "bat",  scoreA: "189/3 (20)",   scoreB: "120/10 (16.0)", result: "Multan Sultans won by 69 runs" },

  // ── Karachi leg (Apr 8 – Apr 19) ──────────────────────────────────
  { matchId: 15, teamA: "HK",  teamB: "PZ",  venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-08T19:00"), status: "completed", tossWinner: "B", tossDecision: "bowl", scoreA: "168/7 (20)",   scoreB: "172/4 (18.2)",  result: "Peshawar Zalmi won by 6 wickets" },
  { matchId: 16, teamA: "LQ",  teamB: "ISU", venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-09T14:30"), status: "completed", tossWinner: "A", tossDecision: "bat",  scoreA: "165/5 (20)",   scoreB: "169/3 (18.4)",  result: "Islamabad United won by 7 wickets" },
  { matchId: 17, teamA: "KK",  teamB: "PZ",  venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-09T19:00"), status: "completed", tossWinner: null, tossDecision: null, scoreA: undefined, scoreB: undefined, result: "Match abandoned without a ball bowled" },
  { matchId: 18, teamA: "QG",  teamB: "RPZ", venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-10T19:00"), status: "completed", tossWinner: "A", tossDecision: "bat",  scoreA: "175/6 (20)",   scoreB: "155/10 (18.4)", result: "Quetta Gladiators won by 20 runs" },
  { matchId: 19, teamA: "PZ",  teamB: "LQ",  venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-11T14:30"), status: "completed", tossWinner: "A", tossDecision: "bowl", scoreA: "211/5 (20)",   scoreB: "203/6 (20)",    result: "Peshawar Zalmi won by 8 runs" },
  { matchId: 20, teamA: "KK",  teamB: "HK",  venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-11T19:00"), status: "completed", tossWinner: "A", tossDecision: "bat",  scoreA: "169/7 (20)",   scoreB: "165/8 (20)",    result: "Karachi Kings won by 4 runs" },
  { matchId: 21, teamA: "HK",  teamB: "ISU", venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-12T19:00"), status: "completed", tossWinner: "B", tossDecision: "bowl", scoreA: "158/8 (20)",   scoreB: "162/4 (18.0)",  result: "Islamabad United won by 6 wickets" },
  { matchId: 22, teamA: "PZ",  teamB: "MS",  venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-13T19:00"), status: "completed", tossWinner: "A", tossDecision: "bowl", scoreA: "204/5 (20)",   scoreB: "200/5 (20)",    result: "Peshawar Zalmi won by 4 runs" },

  // ── Upcoming matches (Apr 15 onward) ──────────────────────────────
  { matchId: 23, teamA: "PZ",  teamB: "QG",  venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-15T19:00"), status: "upcoming", tossWinner: null },
  { matchId: 24, teamA: "HK",  teamB: "RPZ", venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-16T14:30"), status: "upcoming", tossWinner: null },
  { matchId: 25, teamA: "KK",  teamB: "ISU", venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-16T19:00"), status: "upcoming", tossWinner: null },
  { matchId: 26, teamA: "LQ",  teamB: "QG",  venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-17T19:00"), status: "upcoming", tossWinner: null },
  { matchId: 27, teamA: "LQ",  teamB: "RPZ", venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-18T19:00"), status: "upcoming", tossWinner: null },
  { matchId: 28, teamA: "KK",  teamB: "MS",  venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-19T14:30"), status: "upcoming", tossWinner: null },
  { matchId: 29, teamA: "PZ",  teamB: "QG",  venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-19T19:00"), status: "upcoming", tossWinner: null },

  // ── Split leg: Lahore + Karachi (Apr 21 – Apr 26) ─────────────────
  { matchId: 30, teamA: "LQ",  teamB: "QG",  venue: "Gaddafi Stadium, Lahore",              startTime: pkt("2026-04-21T14:30"), status: "upcoming", tossWinner: null },
  { matchId: 31, teamA: "RPZ", teamB: "MS",  venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-21T19:00"), status: "upcoming", tossWinner: null },
  { matchId: 32, teamA: "KK",  teamB: "PZ",  venue: "Gaddafi Stadium, Lahore",              startTime: pkt("2026-04-22T14:30"), status: "upcoming", tossWinner: null },
  { matchId: 33, teamA: "HK",  teamB: "MS",  venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-22T19:00"), status: "upcoming", tossWinner: null },
  { matchId: 34, teamA: "RPZ", teamB: "ISU", venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-23T14:30"), status: "upcoming", tossWinner: null },
  { matchId: 35, teamA: "LQ",  teamB: "KK",  venue: "Gaddafi Stadium, Lahore",              startTime: pkt("2026-04-23T19:00"), status: "upcoming", tossWinner: null },
  { matchId: 36, teamA: "HK",  teamB: "ISU", venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-24T19:00"), status: "upcoming", tossWinner: null },
  { matchId: 37, teamA: "QG",  teamB: "KK",  venue: "Gaddafi Stadium, Lahore",              startTime: pkt("2026-04-25T14:30"), status: "upcoming", tossWinner: null },
  { matchId: 38, teamA: "LQ",  teamB: "PZ",  venue: "Gaddafi Stadium, Lahore",              startTime: pkt("2026-04-25T19:00"), status: "upcoming", tossWinner: null },
  { matchId: 39, teamA: "HK",  teamB: "RPZ", venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-26T14:30"), status: "upcoming", tossWinner: null },
  { matchId: 40, teamA: "ISU", teamB: "MS",  venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-26T19:00"), status: "upcoming", tossWinner: null },

  // ── Playoffs (Apr 28 – May 3) ─────────────────────────────────────
  { matchId: 41, teamA: "TBD", teamB: "TBD", venue: "National Bank Cricket Arena, Karachi", startTime: pkt("2026-04-28T19:00"), status: "upcoming", tossWinner: null, result: "Qualifier" },
  { matchId: 42, teamA: "TBD", teamB: "TBD", venue: "Gaddafi Stadium, Lahore",              startTime: pkt("2026-04-29T19:00"), status: "upcoming", tossWinner: null, result: "Eliminator 1" },
  { matchId: 43, teamA: "TBD", teamB: "TBD", venue: "Gaddafi Stadium, Lahore",              startTime: pkt("2026-05-01T19:00"), status: "upcoming", tossWinner: null, result: "Eliminator 2" },
  { matchId: 44, teamA: "TBD", teamB: "TBD", venue: "Gaddafi Stadium, Lahore",              startTime: pkt("2026-05-03T19:00"), status: "upcoming", tossWinner: null, result: "Final" },
];

// ── PSL 2026 Points Table (as of April 14, after match 22) ──────────

export const PSL_POINTS_TABLE: PointsTableEntry[] = [
  { teamShortName: "PZ",  matches: 6, won: 5, lost: 0, noResult: 1, points: 11, nrr: "+2.722" },
  { teamShortName: "MS",  matches: 6, won: 4, lost: 2, noResult: 0, points: 8,  nrr: "+0.527" },
  { teamShortName: "ISU", matches: 6, won: 3, lost: 2, noResult: 1, points: 7,  nrr: "+1.363" },
  { teamShortName: "KK",  matches: 5, won: 3, lost: 2, noResult: 0, points: 6,  nrr: "-1.395" },
  { teamShortName: "QG",  matches: 5, won: 2, lost: 3, noResult: 0, points: 4,  nrr: "+0.456" },
  { teamShortName: "HK",  matches: 6, won: 2, lost: 4, noResult: 0, points: 4,  nrr: "-0.808" },
  { teamShortName: "LQ",  matches: 5, won: 2, lost: 3, noResult: 0, points: 4,  nrr: "-0.863" },
  { teamShortName: "RPZ", matches: 5, won: 0, lost: 5, noResult: 0, points: 0,  nrr: "-1.864" },
];

// ── Schedule source ─────────────────────────────────────────────────
// Priority: MATCH_SCHEDULE env (JSON) → real schedule above.

function loadSchedule(): Match[] {
  const envSchedule = process.env.MATCH_SCHEDULE;
  if (envSchedule) {
    try {
      return JSON.parse(envSchedule) as Match[];
    } catch {
      console.warn("[Xetrius] Invalid MATCH_SCHEDULE JSON, using real schedule");
    }
  }
  return REAL_SCHEDULE;
}

let _cache: Match[] | null = null;
function getSchedule(): Match[] {
  if (!_cache) _cache = loadSchedule();
  return _cache;
}

/** Invalidate in-memory cache (call after live data merge). */
export function invalidateScheduleCache(): void {
  _cache = null;
}

// ── Public API ──────────────────────────────────────────────────────

export function getAllMatches(): Match[] {
  return getSchedule();
}

export function getMatchById(matchId: number): Match | null {
  return getSchedule().find((m) => m.matchId === matchId) ?? null;
}

export function getActiveMatch(): Match | null {
  const activeId = Number(process.env.NEXT_PUBLIC_ACTIVE_MATCH_ID ?? "23");
  return getMatchById(activeId);
}

export function getMatchWithTeams(match: Match): MatchWithTeams {
  return {
    ...match,
    teamAFull: TEAMS.find((t) => t.shortName === match.teamA),
    teamBFull: TEAMS.find((t) => t.shortName === match.teamB),
  };
}

export function getTossResult(matchId: number): "A" | "B" | null {
  const match = getMatchById(matchId);
  if (!match) return null;
  return match.tossWinner;
}

export function getMatchWindow(
  matchId: number
): { start: number; end: number } | null {
  const match = getMatchById(matchId);
  if (!match) return null;
  return { start: match.startTime, end: match.startTime + CHECK_IN_WINDOW_MS };
}

export function getUpcomingMatches(limit = 5): Match[] {
  return getSchedule()
    .filter((m) => m.status === "upcoming")
    .sort((a, b) => a.startTime - b.startTime)
    .slice(0, limit);
}

export function getCompletedMatches(): Match[] {
  return getSchedule()
    .filter((m) => m.status === "completed")
    .sort((a, b) => b.startTime - a.startTime);
}

export function getLiveMatches(): Match[] {
  return getSchedule().filter((m) => m.status === "live");
}

/**
 * Merge live CricAPI data into the static schedule.
 * Only updates fields that CricAPI provides; static data is the fallback.
 */
export function mergeApiData(
  apiMatches: Partial<Match> & { matchId: number }[]
): void {
  const schedule = getSchedule();
  for (const update of apiMatches) {
    const idx = schedule.findIndex((m) => m.matchId === update.matchId);
    if (idx === -1) continue;
    schedule[idx] = { ...schedule[idx], ...update };
  }
}
