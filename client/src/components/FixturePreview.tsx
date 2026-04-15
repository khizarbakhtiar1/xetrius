"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Radio } from "lucide-react";
import type { MatchData } from "@/types";

interface FixturePreviewProps {
  matches: MatchData[];
}

function formatShortDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function FixturePreview({ matches }: FixturePreviewProps) {
  if (matches.length === 0) return null;

  return (
    <div className="w-full max-w-lg mx-auto mt-10">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-muted" />
        <h2 className="text-sm font-bold">Upcoming Fixtures</h2>
      </div>

      <div className="space-y-2">
        {matches.map((m, i) => (
          <motion.div
            key={m.matchId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-card-border"
          >
            <div className="text-center shrink-0 w-12">
              <p className="text-[10px] font-bold text-muted uppercase">{formatShortDate(m.startTime)}</p>
              <p className="text-[10px] text-muted">{formatTime(m.startTime)}</p>
            </div>

            <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                {m.teamALogo && (
                  <Image src={m.teamALogo} alt={m.teamA} width={20} height={20} className="object-contain shrink-0" />
                )}
                <span className="text-xs font-bold truncate">{m.teamA}</span>
              </div>

              <span className="text-[10px] text-muted font-bold shrink-0">
                {m.status === "live" ? (
                  <span className="inline-flex items-center gap-1 text-red-400">
                    <Radio className="w-3 h-3 animate-pulse" /> LIVE
                  </span>
                ) : "vs"}
              </span>

              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-bold truncate">{m.teamB}</span>
                {m.teamBLogo && (
                  <Image src={m.teamBLogo} alt={m.teamB} width={20} height={20} className="object-contain shrink-0" />
                )}
              </div>
            </div>

            <div className="text-[10px] text-muted shrink-0 w-12 text-right">
              Match {m.matchId}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
