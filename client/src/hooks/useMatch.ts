"use client";

import { useEffect, useState, useCallback } from "react";
import { ACTIVE_MATCH_ID } from "@/lib/quests";
import type { MatchData } from "@/types";

export function useMatch(matchId?: number) {
  const id = matchId ?? ACTIVE_MATCH_ID;
  const [match, setMatch] = useState<MatchData | null>(null);
  const [allMatches, setAllMatches] = useState<MatchData[]>([]);
  const [liveMatch, setLiveMatch] = useState<MatchData | null>(null);
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
        /* match banner is optional UX */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchMatch();
    return () => {
      cancelled = true;
    };
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
        /* silently fail */
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch("/api/match-data?filter=live&live=true");
      if (!res.ok) return;
      const data = await res.json();
      if (data.matches?.length > 0) {
        setLiveMatch(data.matches[0]);
      } else {
        setLiveMatch(null);
      }
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 60_000);
    return () => clearInterval(interval);
  }, [fetchLive]);

  return { match, allMatches, liveMatch, isLoading };
}
