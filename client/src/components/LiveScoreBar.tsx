"use client";

import type { MatchData } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { Radio } from "lucide-react";

interface LiveScoreBarProps {
  match: MatchData | null;
}

export function LiveScoreBar({ match }: LiveScoreBarProps) {
  if (!match) return null;

  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";

  if (!isLive && !isCompleted) return null;

  return (
    <Link
      href={`/matches/${match.matchId}`}
      className="block w-full bg-white/[0.03] border-b border-white/5 hover:bg-white/[0.05] transition-colors"
    >
      <div className="mx-auto max-w-5xl px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {isLive && (
            <span className="flex items-center gap-1.5 text-red-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
              <Radio className="w-3 h-3 animate-pulse" />
              Live
            </span>
          )}
          {isCompleted && (
            <span className="text-muted text-[10px] font-bold uppercase tracking-wider shrink-0">
              Result
            </span>
          )}

          <div className="flex items-center gap-2 min-w-0">
            {match.teamALogo && (
              <Image
                src={match.teamALogo}
                alt={match.teamAName ?? match.teamA}
                width={18}
                height={18}
                className="rounded-sm object-contain"
              />
            )}
            <span className="text-xs font-semibold truncate">
              {match.teamAName ?? match.teamA}
            </span>
            {match.scoreA && (
              <span className="text-xs text-muted font-mono">{match.scoreA}</span>
            )}
          </div>

          <span className="text-muted text-[10px] shrink-0">vs</span>

          <div className="flex items-center gap-2 min-w-0">
            {match.teamBLogo && (
              <Image
                src={match.teamBLogo}
                alt={match.teamBName ?? match.teamB}
                width={18}
                height={18}
                className="rounded-sm object-contain"
              />
            )}
            <span className="text-xs font-semibold truncate">
              {match.teamBName ?? match.teamB}
            </span>
            {match.scoreB && (
              <span className="text-xs text-muted font-mono">{match.scoreB}</span>
            )}
          </div>
        </div>

        {match.result && (
          <p className="text-[10px] text-muted truncate max-w-[200px] hidden sm:block">
            {match.result}
          </p>
        )}
      </div>
    </Link>
  );
}
