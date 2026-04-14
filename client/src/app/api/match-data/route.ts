import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  matchId: z.coerce.number().int().min(0),
});

interface MatchData {
  matchId: number;
  teamA: string;
  teamB: string;
  status: "upcoming" | "live" | "completed";
  tossWinner: "A" | "B" | null;
  startTime: number;
}

const MATCH_DATA: Record<number, MatchData> = {
  1: {
    matchId: 1,
    teamA: "Islamabad United",
    teamB: "Lahore Qalandars",
    status: "live",
    tossWinner: "A",
    startTime: Date.now() - 2 * 60 * 60 * 1000,
  },
  2: {
    matchId: 2,
    teamA: "Karachi Kings",
    teamB: "Peshawar Zalmi",
    status: "upcoming",
    tossWinner: null,
    startTime: Date.now() + 24 * 60 * 60 * 1000,
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ matchId: searchParams.get("matchId") });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "matchId query parameter required (integer)", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const match = MATCH_DATA[parsed.data.matchId];
  if (!match) {
    return NextResponse.json(
      { error: "Match not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json(match);
}
