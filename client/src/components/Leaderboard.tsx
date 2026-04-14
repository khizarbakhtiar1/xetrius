"use client";

import Image from "next/image";
import type { Team } from "@/types";
import { shortenAddress } from "@/lib/utils";
import { motion } from "framer-motion";

interface TeamScore {
  team: Team;
  score: number;
}

interface FanEntry {
  address: string;
  score: number;
}

export function TeamLeaderboard({ teamScores }: { teamScores: TeamScore[] }) {
  const maxScore = teamScores[0]?.score ?? 1;

  if (teamScores.every((t) => t.score === 0)) {
    return (
      <div className="text-center py-20 text-muted text-sm">
        No scores yet — be the first to complete a quest!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {teamScores.map(({ team, score }, i) => {
        const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
        return (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-card border border-card-border"
          >
            <span className="text-lg font-black text-muted w-8 text-center">{i + 1}</span>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
              style={{ backgroundColor: team.primaryColor + "15" }}
            >
              <Image src={team.logo} alt={team.name} width={32} height={32} className="object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{team.name}</p>
              <div className="mt-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: i * 0.05 + 0.2 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: team.primaryColor }}
                />
              </div>
            </div>
            <span className="text-sm font-bold tabular-nums">{score.toLocaleString()}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

export function FanLeaderboard({ fans }: { fans: FanEntry[] }) {
  if (fans.length === 0) {
    return <div className="text-center py-20 text-muted text-sm">No fans yet for this team!</div>;
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[3rem_1fr_5rem] gap-4 px-4 py-2 text-xs font-medium text-muted">
        <span>Rank</span>
        <span>Fan</span>
        <span className="text-right">Points</span>
      </div>
      {fans.map((fan, i) => (
        <motion.div
          key={fan.address}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.03 }}
          className="grid grid-cols-[3rem_1fr_5rem] gap-4 px-4 py-3 rounded-xl items-center hover:bg-white/[0.02] transition-colors"
        >
          <span className={`text-sm font-bold ${i < 3 ? "text-accent" : "text-muted"}`}>
            #{i + 1}
          </span>
          <span className="text-sm font-medium truncate">{shortenAddress(fan.address)}</span>
          <span className="text-sm font-bold tabular-nums text-right">
            {fan.score.toLocaleString()}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
