import { TEAMS } from "./teams";

export interface Match {
  matchId: number;
  teamA: string;
  teamB: string;
  venue: string;
  startTime: number;
  status: "upcoming" | "live" | "completed";
  tossWinner: "A" | "B" | null;
}

export interface MatchWithTeams extends Match {
  teamAFull: typeof TEAMS[number] | undefined;
  teamBFull: typeof TEAMS[number] | undefined;
}

const CHECK_IN_WINDOW_MS = 6 * 60 * 60 * 1000;

// ── Schedule source ─────────────────────────────────────────────────
// Priority: MATCH_SCHEDULE env (JSON) → hardcoded demo schedule.
// For production set MATCH_SCHEDULE as a JSON string in the server env.

const DEMO_SCHEDULE: Match[] = [
  {
    matchId: 1,
    teamA: "ISU",
    teamB: "LQ",
    venue: "Rawalpindi Cricket Stadium",
    startTime: Date.now() - 2 * 60 * 60 * 1000,
    status: "live",
    tossWinner: "A",
  },
  {
    matchId: 2,
    teamA: "KK",
    teamB: "PZ",
    venue: "National Stadium, Karachi",
    startTime: Date.now() + 24 * 60 * 60 * 1000,
    status: "upcoming",
    tossWinner: null,
  },
  {
    matchId: 3,
    teamA: "QG",
    teamB: "MS",
    venue: "Gaddafi Stadium, Lahore",
    startTime: Date.now() + 3 * 24 * 60 * 60 * 1000,
    status: "upcoming",
    tossWinner: null,
  },
  {
    matchId: 4,
    teamA: "RR",
    teamB: "HH",
    venue: "Rawalpindi Cricket Stadium",
    startTime: Date.now() + 5 * 24 * 60 * 60 * 1000,
    status: "upcoming",
    tossWinner: null,
  },
];

function loadSchedule(): Match[] {
  const envSchedule = process.env.MATCH_SCHEDULE;
  if (envSchedule) {
    try {
      return JSON.parse(envSchedule) as Match[];
    } catch {
      console.warn("[Xetrius] Invalid MATCH_SCHEDULE JSON, using demo schedule");
    }
  }
  return DEMO_SCHEDULE;
}

let _cache: Match[] | null = null;
function getSchedule(): Match[] {
  if (!_cache) _cache = loadSchedule();
  return _cache;
}

// ── Public API ──────────────────────────────────────────────────────

export function getAllMatches(): Match[] {
  return getSchedule();
}

export function getMatchById(matchId: number): Match | null {
  return getSchedule().find((m) => m.matchId === matchId) ?? null;
}

export function getActiveMatch(): Match | null {
  const activeId = Number(process.env.NEXT_PUBLIC_ACTIVE_MATCH_ID ?? "1");
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

export function getMatchWindow(matchId: number): { start: number; end: number } | null {
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
