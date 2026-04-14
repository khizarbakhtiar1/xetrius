"use client";

import { useFanWars } from "@/hooks";
import { TEAMS } from "@/lib/teams";
import { TeamLeaderboard, FanLeaderboard } from "@/components/Leaderboard";
import { motion } from "framer-motion";
import Image from "next/image";
import { Trophy, Users, Crown } from "lucide-react";
import { useState } from "react";

type Tab = "teams" | "fans";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("teams");
  const [selectedTeam, setSelectedTeam] = useState(0);
  const { teamScores, topFans } = useFanWars(selectedTeam);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Fan Wars</h1>
            <p className="text-xs text-muted">Franchise-vs-franchise &middot; PSL 2026</p>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl mb-6 w-fit">
          <button
            onClick={() => setTab("teams")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === "teams" ? "bg-white/10 text-white" : "text-muted hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" /> Teams
          </button>
          <button
            onClick={() => setTab("fans")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === "fans" ? "bg-white/10 text-white" : "text-muted hover:text-white"
            }`}
          >
            <Crown className="w-4 h-4" /> Top Fans
          </button>
        </div>

        {tab === "teams" && <TeamLeaderboard teamScores={teamScores} />}

        {tab === "fans" && (
          <div>
            <div className="flex gap-2 flex-wrap mb-4">
              {TEAMS.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    selectedTeam === team.id
                      ? "bg-white/10 border-white/30 text-white"
                      : "bg-white/[0.02] border-white/5 text-muted hover:border-white/15"
                  }`}
                >
                  <Image src={team.logo} alt={team.name} width={16} height={16} className="object-contain" />
                  {team.shortName}
                </button>
              ))}
            </div>
            <FanLeaderboard fans={topFans} />
          </div>
        )}
      </motion.div>
    </div>
  );
}
