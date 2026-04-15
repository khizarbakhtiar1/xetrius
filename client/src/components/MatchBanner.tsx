"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Clock, Radio } from "lucide-react";
import type { MatchData } from "@/types";

interface MatchBannerProps {
  match: MatchData;
}

function StatusBadge({ status }: { status: MatchData["status"] }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/20">
        <Radio className="w-3 h-3 animate-pulse" />
        Live
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-muted border border-white/10">
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20">
      Upcoming
    </span>
  );
}

function formatMatchTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }) + " at " + d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MatchBanner({ match }: MatchBannerProps) {
  return (
    <Link href={`/matches/${match.matchId}`}>
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-xl border border-card-border bg-card p-4 sm:p-5 mb-6 overflow-hidden hover:border-white/15 transition-colors"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
          Match {match.matchId} &middot; PSL 2026
        </p>
        <StatusBadge status={match.status} />
      </div>

      <div className="flex items-center justify-center gap-4 sm:gap-8">
        <div className="flex flex-col items-center gap-2 min-w-0">
          {match.teamALogo && (
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: (match.teamAPrimaryColor ?? "#fff") + "15" }}
            >
              <Image src={match.teamALogo} alt={match.teamAName ?? match.teamA} width={40} height={40} className="object-contain" />
            </div>
          )}
          <p className="text-xs sm:text-sm font-bold text-center truncate max-w-[80px] sm:max-w-none">
            {match.teamAName ?? match.teamA}
          </p>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-lg sm:text-xl font-black text-muted">vs</span>
        </div>

        <div className="flex flex-col items-center gap-2 min-w-0">
          {match.teamBLogo && (
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: (match.teamBPrimaryColor ?? "#fff") + "15" }}
            >
              <Image src={match.teamBLogo} alt={match.teamBName ?? match.teamB} width={40} height={40} className="object-contain" />
            </div>
          )}
          <p className="text-xs sm:text-sm font-bold text-center truncate max-w-[80px] sm:max-w-none">
            {match.teamBName ?? match.teamB}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {match.venue}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatMatchTime(match.startTime)}
        </span>
      </div>
    </motion.div>
    </Link>
  );
}
