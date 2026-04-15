import { NextResponse } from "next/server";
import {
  getAllMatches,
  getMatchById,
  getMatchWithTeams,
  getCompletedMatches,
  getUpcomingMatches,
  getLiveMatches,
  PSL_POINTS_TABLE,
  type Match,
} from "@/lib/matches";
import { fetchCurrentMatches, formatScore, mapTeamCode } from "@/lib/cricapi";

function enrichMatch(m: Match) {
  const enriched = getMatchWithTeams(m);
  return {
    matchId: enriched.matchId,
    teamA: enriched.teamA,
    teamB: enriched.teamB,
    venue: enriched.venue,
    startTime: enriched.startTime,
    status: enriched.status,
    tossWinner: enriched.tossWinner,
    tossDecision: enriched.tossDecision ?? null,
    scoreA: enriched.scoreA ?? null,
    scoreB: enriched.scoreB ?? null,
    result: enriched.result ?? null,
    teamAName: enriched.teamAFull?.name ?? enriched.teamA,
    teamALogo: enriched.teamAFull?.logo ?? null,
    teamAPrimaryColor: enriched.teamAFull?.primaryColor ?? null,
    teamBName: enriched.teamBFull?.name ?? enriched.teamB,
    teamBLogo: enriched.teamBFull?.logo ?? null,
    teamBPrimaryColor: enriched.teamBFull?.primaryColor ?? null,
  };
}

async function tryMergeLiveData() {
  const liveMatches = await fetchCurrentMatches();
  if (!liveMatches || liveMatches.length === 0) return;

  const allMatches = getAllMatches();

  for (const apiMatch of liveMatches) {
    if (!apiMatch.teams || apiMatch.teams.length < 2) continue;

    const teamCodes = apiMatch.teamInfo?.map((t) => mapTeamCode(t.shortname)) ?? [];
    const staticMatch = allMatches.find(
      (m) =>
        (teamCodes.includes(m.teamA) && teamCodes.includes(m.teamB)) ||
        m.venue.toLowerCase().includes(apiMatch.venue?.toLowerCase().split(",")[0] ?? "")
    );
    if (!staticMatch) continue;

    let status: Match["status"] = staticMatch.status;
    if (apiMatch.matchStarted && !apiMatch.matchEnded) status = "live";
    else if (apiMatch.matchEnded) status = "completed";

    const scores = apiMatch.score ?? [];
    const scoreA =
      scores.length > 0
        ? formatScore(scores[0])
        : staticMatch.scoreA;
    const scoreB =
      scores.length > 1
        ? formatScore(scores[1])
        : staticMatch.scoreB;

    staticMatch.status = status;
    if (scoreA) staticMatch.scoreA = scoreA;
    if (scoreB) staticMatch.scoreB = scoreB;
    if (apiMatch.status) staticMatch.result = apiMatch.status;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchIdParam = searchParams.get("matchId");
  const liveParam = searchParams.get("live");
  const filterParam = searchParams.get("filter");

  if (liveParam === "true") {
    await tryMergeLiveData();
  }

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

    return NextResponse.json(enrichMatch(match));
  }

  if (filterParam === "upcoming") {
    const limit = Number(searchParams.get("limit") ?? "10");
    return NextResponse.json({
      matches: getUpcomingMatches(limit).map(enrichMatch),
    });
  }

  if (filterParam === "completed") {
    return NextResponse.json({
      matches: getCompletedMatches().map(enrichMatch),
    });
  }

  if (filterParam === "live") {
    return NextResponse.json({
      matches: getLiveMatches().map(enrichMatch),
    });
  }

  if (filterParam === "points-table") {
    return NextResponse.json({ pointsTable: PSL_POINTS_TABLE });
  }

  const schedule = getAllMatches().map(enrichMatch);
  return NextResponse.json({ matches: schedule });
}
