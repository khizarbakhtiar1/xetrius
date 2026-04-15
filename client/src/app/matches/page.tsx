"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Trophy, Table, MapPin, Clock } from "lucide-react";
import type { MatchData, PointsTableEntry } from "@/types";
import { TEAMS } from "@/lib/teams";

type Tab = "schedule" | "results" | "standings";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-PK", {
    weekday: "short",
    month: "short",
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

function MatchRow({ match }: { match: MatchData }) {
  const isCompleted = match.status === "completed";
  const isLive = match.status === "live";

  return (
    <Link
      href={`/matches/${match.matchId}`}
      className="block p-4 rounded-xl bg-card border border-card-border hover:border-white/15 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted uppercase tracking-wider font-medium">
          Match {match.matchId}
        </span>
        {isLive && (
          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold uppercase">
            Live
          </span>
        )}
        {isCompleted && (
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-muted text-[10px] font-bold uppercase">
            Completed
          </span>
        )}
        {!isLive && !isCompleted && (
          <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase">
            Upcoming
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {match.teamALogo && (
            <Image src={match.teamALogo} alt={match.teamAName ?? ""} width={28} height={28} className="rounded object-contain shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{match.teamAName ?? match.teamA}</p>
            {match.scoreA && <p className="text-xs text-muted font-mono">{match.scoreA}</p>}
          </div>
        </div>

        <span className="text-xs text-muted font-medium shrink-0">vs</span>

        <div className="flex-1 flex items-center gap-2 min-w-0 justify-end text-right">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{match.teamBName ?? match.teamB}</p>
            {match.scoreB && <p className="text-xs text-muted font-mono">{match.scoreB}</p>}
          </div>
          {match.teamBLogo && (
            <Image src={match.teamBLogo} alt={match.teamBName ?? ""} width={28} height={28} className="rounded object-contain shrink-0" />
          )}
        </div>
      </div>

      {match.result && (
        <p className="text-xs text-muted mt-2 truncate">{match.result}</p>
      )}

      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" /> {formatDate(match.startTime)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {formatTime(match.startTime)}
        </span>
        <span className="flex items-center gap-1 truncate">
          <MapPin className="w-3 h-3" /> {match.venue}
        </span>
      </div>
    </Link>
  );
}

function PointsTableView({ entries }: { entries: PointsTableEntry[] }) {
  return (
    <div className="overflow-x-auto">
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
                    <span className="text-xs text-muted">{e.teamShortName}</span>
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

export default function MatchesPage() {
  const [tab, setTab] = useState<Tab>("schedule");
  const [allMatches, setAllMatches] = useState<MatchData[]>([]);
  const [pointsTable, setPointsTable] = useState<PointsTableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [matchesRes, ptRes] = await Promise.all([
          fetch("/api/match-data"),
          fetch("/api/match-data?filter=points-table"),
        ]);
        if (matchesRes.ok) {
          const d = await matchesRes.json();
          if (!cancelled && d.matches) setAllMatches(d.matches);
        }
        if (ptRes.ok) {
          const d = await ptRes.json();
          if (!cancelled && d.pointsTable) setPointsTable(d.pointsTable);
        }
      } catch {
        /* non-critical */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const upcoming = allMatches
    .filter((m) => m.status === "upcoming")
    .sort((a, b) => a.startTime - b.startTime);
  const completed = allMatches
    .filter((m) => m.status === "completed")
    .sort((a, b) => b.startTime - a.startTime);
  const live = allMatches.filter((m) => m.status === "live");

  const tabClasses = (t: Tab) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
      tab === t ? "bg-white/10 text-white" : "text-muted hover:text-white"
    }`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted text-sm">
        Loading matches...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold">PSL 2026 Matches</h1>
            <p className="text-xs text-muted">44 matches &middot; Mar 26 – May 3 &middot; Season 11</p>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl mb-6 w-fit">
          <button onClick={() => setTab("schedule")} className={tabClasses("schedule")}>
            <Calendar className="w-4 h-4" /> Schedule
          </button>
          <button onClick={() => setTab("results")} className={tabClasses("results")}>
            <Trophy className="w-4 h-4" /> Results
          </button>
          <button onClick={() => setTab("standings")} className={tabClasses("standings")}>
            <Table className="w-4 h-4" /> Standings
          </button>
        </div>

        {tab === "schedule" && (
          <div className="space-y-3">
            {live.length > 0 && (
              <>
                <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider">Live Now</h2>
                {live.map((m) => <MatchRow key={m.matchId} match={m} />)}
              </>
            )}
            <h2 className="text-sm font-bold text-muted uppercase tracking-wider">
              Upcoming ({upcoming.length})
            </h2>
            {upcoming.length === 0 && <p className="text-sm text-muted">No upcoming matches</p>}
            {upcoming.map((m) => <MatchRow key={m.matchId} match={m} />)}
          </div>
        )}

        {tab === "results" && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-muted uppercase tracking-wider">
              Completed ({completed.length})
            </h2>
            {completed.map((m) => <MatchRow key={m.matchId} match={m} />)}
          </div>
        )}

        {tab === "standings" && (
          <div className="bg-card border border-card-border rounded-xl p-4">
            <h2 className="text-sm font-bold mb-4">PSL 2026 Points Table</h2>
            <PointsTableView entries={pointsTable} />
          </div>
        )}
      </motion.div>
    </div>
  );
}
