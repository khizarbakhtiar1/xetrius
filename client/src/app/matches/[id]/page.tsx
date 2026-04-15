"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Clock, Radio, Coins } from "lucide-react";
import type { MatchData } from "@/types";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Karachi",
  });
}

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = Number(params.id);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatch = useCallback(async () => {
    try {
      const live = match?.status === "live" ? "&live=true" : "";
      const res = await fetch(`/api/match-data?matchId=${matchId}${live}`);
      if (!res.ok) {
        if (res.status === 404) setError("Match not found");
        return;
      }
      const data = await res.json();
      setMatch(data);
    } catch {
      setError("Failed to load match");
    } finally {
      setIsLoading(false);
    }
  }, [matchId, match?.status]);

  useEffect(() => {
    fetchMatch();
  }, [matchId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (match?.status !== "live") return;
    const interval = setInterval(fetchMatch, 30_000);
    return () => clearInterval(interval);
  }, [match?.status, fetchMatch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted text-sm">
        Loading match...
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted text-sm">{error ?? "Match not found"}</p>
        <Link href="/matches" className="text-sm text-accent hover:underline">
          Back to matches
        </Link>
      </div>
    );
  }

  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";
  const isUpcoming = match.status === "upcoming";
  const isTbd = match.teamA === "TBD";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/matches"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> All Matches
        </Link>

        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs text-muted uppercase tracking-wider font-medium">
              {match.result && (match.result.startsWith("Qualifier") || match.result.startsWith("Eliminator") || match.result === "Final")
                ? match.result
                : `Match ${match.matchId}`}
            </span>
            {isLive && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold uppercase">
                <Radio className="w-3 h-3 animate-pulse" /> Live
              </span>
            )}
            {isCompleted && (
              <span className="px-2.5 py-1 rounded-full bg-white/5 text-muted text-xs font-bold uppercase">
                Completed
              </span>
            )}
            {isUpcoming && (
              <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase">
                Upcoming
              </span>
            )}
          </div>

          {/* Teams + Scores */}
          <div className="px-6 py-8">
            {isTbd ? (
              <div className="text-center">
                <p className="text-lg font-bold text-muted">Teams TBD</p>
                <p className="text-xs text-muted mt-1">
                  {match.result ?? "To be determined after league stage"}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                {/* Team A */}
                <div className="flex-1 text-center">
                  {match.teamALogo && (
                    <div className="w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: (match.teamAPrimaryColor ?? "#fff") + "15" }}>
                      <Image src={match.teamALogo} alt="" width={48} height={48} className="object-contain" />
                    </div>
                  )}
                  <p className="text-sm font-bold">{match.teamAName ?? match.teamA}</p>
                  {match.scoreA && (
                    <p className="text-2xl font-bold font-mono mt-1">{match.scoreA}</p>
                  )}
                </div>

                <div className="text-center shrink-0">
                  <p className="text-lg font-bold text-muted">vs</p>
                </div>

                {/* Team B */}
                <div className="flex-1 text-center">
                  {match.teamBLogo && (
                    <div className="w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: (match.teamBPrimaryColor ?? "#fff") + "15" }}>
                      <Image src={match.teamBLogo} alt="" width={48} height={48} className="object-contain" />
                    </div>
                  )}
                  <p className="text-sm font-bold">{match.teamBName ?? match.teamB}</p>
                  {match.scoreB && (
                    <p className="text-2xl font-bold font-mono mt-1">{match.scoreB}</p>
                  )}
                </div>
              </div>
            )}

            {match.result && isCompleted && !isTbd && (
              <p className="text-center text-sm font-medium text-accent mt-6">{match.result}</p>
            )}

            {isLive && (
              <p className="text-center text-xs text-muted mt-4 animate-pulse">
                Auto-refreshing every 30s
              </p>
            )}
          </div>

          {/* Match Info */}
          <div className="px-6 py-4 border-t border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(match.startTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(match.startTime)} PKT</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <MapPin className="w-3.5 h-3.5" />
              <span>{match.venue}</span>
            </div>
            {match.tossWinner && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <Coins className="w-3.5 h-3.5" />
                <span>
                  Toss: {match.tossWinner === "A" ? (match.teamAName ?? match.teamA) : (match.teamBName ?? match.teamB)} won
                  {match.tossDecision ? ` and chose to ${match.tossDecision}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
