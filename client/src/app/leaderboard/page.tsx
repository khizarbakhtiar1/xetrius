"use client";

import { useFanWars } from "@/hooks";
import { TEAMS } from "@/lib/teams";
import { TeamLeaderboard, FanLeaderboard } from "@/components/Leaderboard";
import { motion } from "framer-motion";
import Image from "next/image";
import { Trophy, Users, Crown, Table } from "lucide-react";
import { useState, useEffect } from "react";
import type { PointsTableEntry } from "@/types";

type Tab = "teams" | "fans" | "standings";

function PslStandings({ entries }: { entries: PointsTableEntry[] }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted text-xs border-b border-white/5">
            <th className="text-left py-3 px-2">#</th>
            <th className="text-left py-3 px-2">Team</th>
            <th className="text-center py-3 px-2">M</th>
            <th className="text-center py-3 px-2">W</th>
            <th className="text-center py-3 px-2">L</th>
            <th className="text-center py-3 px-2">NR</th>
            <th className="text-center py-3 px-2">Pts</th>
            <th className="text-right py-3 px-2">NRR</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            const team = TEAMS.find((t) => t.shortName === e.teamShortName);
            const isQualified = i < 4;
            return (
              <tr
                key={e.teamShortName}
                className={`border-b border-white/5 ${isQualified ? "bg-white/[0.02]" : ""}`}
              >
                <td className="py-3 px-2 text-muted">{i + 1}</td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    {team?.logo && (
                      <Image src={team.logo} alt={team.name} width={20} height={20} className="rounded-sm object-contain" />
                    )}
                    <span className="font-semibold text-sm">{team?.name ?? e.teamShortName}</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-center">{e.matches}</td>
                <td className="py-3 px-2 text-center text-green-400 font-medium">{e.won}</td>
                <td className="py-3 px-2 text-center text-red-400 font-medium">{e.lost}</td>
                <td className="py-3 px-2 text-center text-muted">{e.noResult}</td>
                <td className="py-3 px-2 text-center font-bold">{e.points}</td>
                <td className="py-3 px-2 text-right font-mono text-xs">
                  <span className={Number(e.nrr) >= 0 ? "text-green-400" : "text-red-400"}>
                    {Number(e.nrr) >= 0 ? "+" : ""}{e.nrr}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-[10px] text-muted mt-3 px-2">
        Top 4 teams qualify for playoffs. Updated after Match 22 (Apr 14).
      </p>
    </div>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("teams");
  const [selectedTeam, setSelectedTeam] = useState(0);
  const { teamScores, topFans } = useFanWars(selectedTeam);
  const [pointsTable, setPointsTable] = useState<PointsTableEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/match-data?filter=points-table");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.pointsTable) setPointsTable(data.pointsTable);
      } catch { /* non-critical */ }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const tabClasses = (t: Tab) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
      tab === t ? "bg-white/10 text-white" : "text-muted hover:text-white"
    }`;

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
          <button onClick={() => setTab("teams")} className={tabClasses("teams")}>
            <Users className="w-4 h-4" /> Teams
          </button>
          <button onClick={() => setTab("fans")} className={tabClasses("fans")}>
            <Crown className="w-4 h-4" /> Top Fans
          </button>
          <button onClick={() => setTab("standings")} className={tabClasses("standings")}>
            <Table className="w-4 h-4" /> PSL Standings
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

        {tab === "standings" && <PslStandings entries={pointsTable} />}
      </motion.div>
    </div>
  );
}
