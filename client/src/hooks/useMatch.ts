"use client";

import { useEffect, useState } from "react";
import { ACTIVE_MATCH_ID } from "@/lib/quests";
import type { MatchData } from "@/types";

export function useMatch(matchId?: number) {
  const id = matchId ?? ACTIVE_MATCH_ID;
  const [match, setMatch] = useState<MatchData | null>(null);
  const [allMatches, setAllMatches] = useState<MatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchMatch() {
      try {
        const res = await fetch(`/api/match-data?matchId=${id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setMatch(data);
      } catch {
        // silently fail — match banner is optional UX
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchMatch();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        const res = await fetch("/api/match-data");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.matches) setAllMatches(data.matches);
      } catch {
        // silently fail
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  return { match, allMatches, isLoading };
}
