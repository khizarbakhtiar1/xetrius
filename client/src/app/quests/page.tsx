"use client";

import { useAccount } from "wagmi";
import { useTeamPass, useQuests, useMatch } from "@/hooks";
import { useMounted } from "@/hooks/useMounted";
import { QUESTS, ACTIVE_MATCH_ID } from "@/lib/quests";
import { getTeamById } from "@/lib/teams";
import { QuestCard } from "@/components/QuestCard";
import { MatchBanner } from "@/components/MatchBanner";
import { StampBadge } from "@/components/StampBadge";
import { StampReveal } from "@/components/StampReveal";
import { TxToast } from "@/components/TxToast";
import { motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Ticket, MapPin, Vote, Users, Coins, ArrowRight, Target, Tv, Star, type LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  ticket: Ticket,
  "map-pin": MapPin,
  vote: Vote,
  users: Users,
  coins: Coins,
  target: Target,
  tv: Tv,
  star: Star,
};

const STAMP_META: Record<number, { emoji: string; label: string; points: number }> = {
  1: { emoji: "🎫", label: "Team Pass Holder", points: 10 },
  2: { emoji: "🪙", label: "Toss Oracle", points: 25 },
  3: { emoji: "📍", label: "Match Check-in", points: 15 },
  4: { emoji: "🗳️", label: "Fan Voter", points: 15 },
  5: { emoji: "🤝", label: "Recruiter", points: 30 },
  6: { emoji: "🎯", label: "Match Prophet", points: 35 },
  7: { emoji: "📺", label: "Watch Party", points: 20 },
  8: { emoji: "⭐", label: "Superfan", points: 50 },
};

const POLL_OPTIONS = [
  { id: "A", label: "Best Batting" },
  { id: "B", label: "Best Bowling" },
  { id: "C", label: "Best Fielding" },
  { id: "D", label: "Most Entertaining" },
] as const;

export default function QuestsPage() {
  const mounted = useMounted();
  const { isConnected } = useAccount();
  const { hasPass, teamId, referralCount, address } = useTeamPass();
  const {
    progress,
    stampBalances,
    completeQuest,
    questStatus,
    questError,
  } = useQuests();
  const { match } = useMatch();

  const team = teamId !== null ? getTeamById(teamId) : null;

  const [revealStamp, setRevealStamp] = useState<number | null>(null);
  const [tossPrediction, setTossPrediction] = useState<"A" | "B" | null>(null);
  const [matchPrediction, setMatchPrediction] = useState<"A" | "B" | null>(null);
  const [matchPredSubmitted, setMatchPredSubmitted] = useState(false);
  const [matchPredError, setMatchPredError] = useState<string | null>(null);
  const [pollVote, setPollVote] = useState<string | null>(null);
  const [pollSubmitted, setPollSubmitted] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);

  const prevCompletedRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    for (const p of progress) {
      if (p.completed && !prevCompletedRef.current.has(p.questId)) {
        prevCompletedRef.current.add(p.questId);
        const quest = QUESTS.find((q) => q.id === p.questId);
        if (quest) {
          queueMicrotask(() => {
            setRevealStamp(quest.stampId);
          });
        }
      }
    }
  }, [progress]);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    async function checkPollStatus() {
      try {
        const res = await fetch(`/api/fan-poll?userAddress=${address}&matchId=${ACTIVE_MATCH_ID}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.voted) {
          setPollSubmitted(true);
          if (data.choice) setPollVote(data.choice);
        }
      } catch { /* non-critical */ }
    }
    checkPollStatus();
    return () => { cancelled = true; };
  }, [address]);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    async function checkPredStatus() {
      try {
        const res = await fetch(`/api/match-prediction?userAddress=${address}&matchId=${ACTIVE_MATCH_ID}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.predicted) {
          setMatchPredSubmitted(true);
          if (data.choice) setMatchPrediction(data.choice);
        }
      } catch { /* non-critical */ }
    }
    checkPredStatus();
    return () => { cancelled = true; };
  }, [address]);

  const submitMatchPrediction = useCallback(async () => {
    if (!matchPrediction || !address) return;
    setMatchPredError(null);
    try {
      const res = await fetch("/api/match-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: address,
          matchId: ACTIVE_MATCH_ID,
          choice: matchPrediction,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.code === "ALREADY_PREDICTED") {
          setMatchPredSubmitted(true);
          return;
        }
        setMatchPredError(data?.error ?? "Failed to submit prediction");
        return;
      }
      setMatchPredSubmitted(true);
    } catch {
      setMatchPredError("Network error — try again");
    }
  }, [matchPrediction, address]);

  const submitPollVote = useCallback(async () => {
    if (!pollVote || !address) return;
    setPollError(null);
    try {
      const res = await fetch("/api/fan-poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: address,
          matchId: ACTIVE_MATCH_ID,
          choice: pollVote,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.code === "ALREADY_VOTED") {
          setPollSubmitted(true);
          return;
        }
        setPollError(data?.error ?? "Failed to submit vote");
        return;
      }
      setPollSubmitted(true);
    } catch {
      setPollError("Network error — try again");
    }
  }, [pollVote, address]);

  const activeStatus = Object.values(questStatus).find(
    (s) => s === "signing" || s === "pending" || s === "confirmed" || s === "error"
  );

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <p className="text-muted text-sm">Connect your wallet to view quests</p>
      </div>
    );
  }

  if (!hasPass) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <p className="text-muted text-sm mb-4">You need a Team Pass first</p>
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold">
          Mint Team Pass <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const referralLink =
    mounted && address ? `${window.location.origin}?ref=${address}` : "";
  const activeReveal = revealStamp ? STAMP_META[revealStamp] : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {activeReveal && (
        <StampReveal
          show={!!revealStamp}
          stampEmoji={activeReveal.emoji}
          stampLabel={activeReveal.label}
          points={activeReveal.points}
          onClose={() => setRevealStamp(null)}
        />
      )}
      <TxToast show={!!activeStatus} status={activeStatus ?? "idle"} />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {team && (
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: team.primaryColor + "15" }}
            >
              <Image src={team.logo} alt={team.name} width={32} height={32} className="object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Active Quests</h1>
              <p className="text-xs text-muted">{team.name} &middot; PSL 2026</p>
            </div>
          </div>
        )}

        {match && <MatchBanner match={match} />}

        <div className="space-y-3 mb-10">
          {QUESTS.map((quest) => {
            const completed = progress.find((p) => p.questId === quest.id)?.completed ?? false;
            const qStatus = questStatus[quest.id] ?? "idle";
            const qError = questError[quest.id] ?? null;
            const Icon = ICON_MAP[quest.icon] ?? Ticket;
            const qLoading = qStatus === "signing" || qStatus === "pending";

            let disabled = false;
            let label: string | undefined;
            let onAction: () => void;

            switch (quest.id) {
              case 2: {
                disabled = !tossPrediction;
                label = tossPrediction ? "Submit Prediction" : "Select your prediction";
                onAction = () => completeQuest(quest.id, { predictedWinner: tossPrediction });
                break;
              }
              case 4: {
                disabled = !pollSubmitted;
                label = pollSubmitted ? "Claim Stamp" : "Vote first to unlock";
                onAction = () => completeQuest(quest.id);
                break;
              }
              case 5: {
                disabled = referralCount === 0 && !completed;
                label = referralCount === 0 ? "No referrals yet" : undefined;
                onAction = () => completeQuest(quest.id);
                break;
              }
              case 6: {
                disabled = !matchPredSubmitted;
                label = matchPredSubmitted ? "Claim Stamp" : "Submit prediction first";
                onAction = () => completeQuest(quest.id);
                break;
              }
              case 7: {
                label = "Check In Now";
                onAction = () => completeQuest(quest.id);
                break;
              }
              case 8: {
                const base5Done = progress.filter((p) => p.questId <= 5 && p.completed).length === 5;
                disabled = !base5Done;
                label = base5Done ? "Claim Superfan Stamp" : "Complete quests 1-5 first";
                onAction = () => completeQuest(quest.id);
                break;
              }
              default: {
                onAction = () => completeQuest(quest.id);
                break;
              }
            }

            return (
              <QuestCard
                key={quest.id}
                title={quest.title}
                description={quest.description}
                points={quest.points}
                icon={Icon}
                completed={completed}
                onAction={onAction}
                actionLabel={label ?? (completed ? "Completed" : "Complete Quest")}
                loading={qLoading}
                disabled={disabled}
                status={qStatus}
                errorMessage={qError}
              >
                {/* Quest 2: Toss Prediction selector */}
                {quest.id === 2 && !completed && (
                  <div className="flex gap-2">
                    {(["A", "B"] as const).map((side) => {
                      const teamName = side === "A" ? (match?.teamAName ?? "Team A") : (match?.teamBName ?? "Team B");
                      const teamLogo = side === "A" ? match?.teamALogo : match?.teamBLogo;
                      return (
                        <button
                          key={side}
                          onClick={() => setTossPrediction(side)}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex items-center justify-center gap-2 ${
                            tossPrediction === side
                              ? "bg-white text-black border-white"
                              : "bg-white/5 text-muted border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {teamLogo && <Image src={teamLogo} alt={teamName} width={16} height={16} className="rounded-sm object-contain" />}
                          {teamName}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Quest 4: Fan Poll vote UI */}
                {quest.id === 4 && !completed && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted font-medium">
                      {pollSubmitted ? "Vote submitted! Claim your stamp." : "Vote for your Player of the Match award:"}
                    </p>
                    {!pollSubmitted && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          {POLL_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => setPollVote(opt.id)}
                              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                                pollVote === opt.id
                                  ? "bg-white text-black border-white"
                                  : "bg-white/5 text-muted border-white/10 hover:bg-white/10"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={submitPollVote}
                          disabled={!pollVote}
                          className="w-full px-3 py-2 rounded-lg text-xs font-semibold bg-accent text-black hover:bg-accent/90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Submit Vote
                        </button>
                        {pollError && (
                          <p className="text-xs text-red-400">{pollError}</p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Quest 6: Match Winner Prediction */}
                {quest.id === 6 && !completed && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted font-medium">
                      {matchPredSubmitted ? "Prediction locked! Claim stamp after match ends." : "Who will win this match?"}
                    </p>
                    {!matchPredSubmitted && (
                      <>
                        <div className="flex gap-2">
                          {(["A", "B"] as const).map((side) => {
                            const teamName = side === "A" ? (match?.teamAName ?? "Team A") : (match?.teamBName ?? "Team B");
                            const teamLogo = side === "A" ? match?.teamALogo : match?.teamBLogo;
                            return (
                              <button
                                key={side}
                                onClick={() => setMatchPrediction(side)}
                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex items-center justify-center gap-2 ${
                                  matchPrediction === side
                                    ? "bg-white text-black border-white"
                                    : "bg-white/5 text-muted border-white/10 hover:bg-white/10"
                                }`}
                              >
                                {teamLogo && <Image src={teamLogo} alt={teamName} width={16} height={16} className="rounded-sm object-contain" />}
                                {teamName}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={submitMatchPrediction}
                          disabled={!matchPrediction}
                          className="w-full px-3 py-2 rounded-lg text-xs font-semibold bg-accent text-black hover:bg-accent/90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Lock Prediction
                        </button>
                        {matchPredError && <p className="text-xs text-red-400">{matchPredError}</p>}
                      </>
                    )}
                  </div>
                )}

                {/* Quest 5: Referral link */}
                {quest.id === 5 && !completed && referralLink && (
                  <div className="flex gap-2 items-center">
                    <input
                      readOnly
                      value={referralLink}
                      className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-muted truncate"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(referralLink)}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </QuestCard>
            );
          })}
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">Your Stamps</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {stampBalances.map((s) => (
              <StampBadge key={s.id} stampId={s.id} owned={s.balance > 0} count={s.balance} />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
