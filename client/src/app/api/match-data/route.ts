import { NextResponse } from "next/server";
import { getAllMatches, getMatchById, getMatchWithTeams } from "@/lib/matches";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchIdParam = searchParams.get("matchId");

  if (matchIdParam) {
    const matchId = Number(matchIdParam);
    if (!Number.isInteger(matchId) || matchId < 0) {
      return NextResponse.json(
        { error: "matchId must be a non-negative integer", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const match = getMatchById(matchId);
    if (!match) {
      return NextResponse.json(
        { error: "Match not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const enriched = getMatchWithTeams(match);
    return NextResponse.json({
      matchId: enriched.matchId,
      teamA: enriched.teamA,
      teamB: enriched.teamB,
      venue: enriched.venue,
      startTime: enriched.startTime,
      status: enriched.status,
      tossWinner: enriched.tossWinner,
      teamAName: enriched.teamAFull?.name ?? enriched.teamA,
      teamALogo: enriched.teamAFull?.logo ?? null,
      teamAPrimaryColor: enriched.teamAFull?.primaryColor ?? null,
      teamBName: enriched.teamBFull?.name ?? enriched.teamB,
      teamBLogo: enriched.teamBFull?.logo ?? null,
      teamBPrimaryColor: enriched.teamBFull?.primaryColor ?? null,
    });
  }

  const schedule = getAllMatches().map((m) => {
    const enriched = getMatchWithTeams(m);
    return {
      matchId: enriched.matchId,
      teamA: enriched.teamA,
      teamB: enriched.teamB,
      venue: enriched.venue,
      startTime: enriched.startTime,
      status: enriched.status,
      tossWinner: enriched.tossWinner,
      teamAName: enriched.teamAFull?.name ?? enriched.teamA,
      teamALogo: enriched.teamAFull?.logo ?? null,
      teamAPrimaryColor: enriched.teamAFull?.primaryColor ?? null,
      teamBName: enriched.teamBFull?.name ?? enriched.teamB,
      teamBLogo: enriched.teamBFull?.logo ?? null,
      teamBPrimaryColor: enriched.teamBFull?.primaryColor ?? null,
    };
  });

  return NextResponse.json({ matches: schedule });
}
