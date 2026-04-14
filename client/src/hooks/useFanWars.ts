"use client";

import { useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { ADDRESSES, FAN_WARS_ABI } from "@/lib/contracts";
import { TEAMS } from "@/lib/teams";
import type { Team } from "@/types";

interface TeamScore {
  team: Team;
  score: number;
}

interface FanEntry {
  address: string;
  score: number;
}

export function useFanWars(selectedTeamId?: number) {
  const { address } = useAccount();

  // ── Team leaderboard ──────────────────────────────────────────────

  const { data: leaderboardRaw, isLoading: isLeaderboardLoading } = useReadContract({
    address: ADDRESSES.fanWars,
    abi: FAN_WARS_ABI,
    functionName: "getLeaderboard",
  });

  const teamScores: TeamScore[] = useMemo(() => {
    const scores = leaderboardRaw as readonly bigint[] | undefined;
    return TEAMS.map((team) => ({
      team,
      score: scores ? Number(scores[team.id]) : 0,
    })).sort((a, b) => b.score - a.score);
  }, [leaderboardRaw]);

  // ── Top fans for a team ───────────────────────────────────────────

  const { data: topFansRaw, isLoading: isTopFansLoading } = useReadContract({
    address: ADDRESSES.fanWars,
    abi: FAN_WARS_ABI,
    functionName: "getTopFans",
    args: selectedTeamId !== undefined ? [selectedTeamId, 20n] : undefined,
    query: { enabled: selectedTeamId !== undefined },
  });

  const topFans: FanEntry[] = useMemo(() => {
    const data = topFansRaw as readonly [readonly string[], readonly bigint[]] | undefined;
    if (!data) return [];
    const [addrs, scores] = data;
    return addrs.map((addr, i) => ({
      address: addr,
      score: Number(scores[i]),
    }));
  }, [topFansRaw]);

  // ── Current user score ────────────────────────────────────────────

  const { data: fanScoreRaw } = useReadContract({
    address: ADDRESSES.fanWars,
    abi: FAN_WARS_ABI,
    functionName: "fanScores",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const fanScore = fanScoreRaw ? Number(fanScoreRaw) : 0;

  return {
    teamScores,
    topFans,
    fanScore,
    isLoading: isLeaderboardLoading || isTopFansLoading,
  };
}
