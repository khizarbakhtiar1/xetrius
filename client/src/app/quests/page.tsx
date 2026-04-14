"use client";

import { useAccount } from "wagmi";
import { useTeamPass, useQuests } from "@/hooks";
import { QUESTS } from "@/lib/quests";
import { getTeamById } from "@/lib/teams";
import { QuestCard } from "@/components/QuestCard";
import { StampBadge } from "@/components/StampBadge";
import { StampReveal } from "@/components/StampReveal";
import { TxToast } from "@/components/TxToast";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Ticket, MapPin, Vote, Users, Coins, ArrowRight, type LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  ticket: Ticket,
  "map-pin": MapPin,
  vote: Vote,
  users: Users,
  coins: Coins,
};

const STAMP_META: Record<number, { emoji: string; label: string; points: number }> = {
  1: { emoji: "🎫", label: "Team Pass Holder", points: 10 },
  2: { emoji: "🪙", label: "Toss Oracle", points: 25 },
  3: { emoji: "📍", label: "Match Check-in", points: 15 },
  4: { emoji: "🗳️", label: "Fan Voter", points: 15 },
  5: { emoji: "🤝", label: "Recruiter", points: 30 },
};

export default function QuestsPage() {
  const { isConnected } = useAccount();
  const { hasPass, teamId, referralCount, address } = useTeamPass();
  const {
    progress,
    stampBalances,
    completeQuest,
    questStatus,
    questError,
  } = useQuests();

  const team = teamId !== null ? getTeamById(teamId) : null;

  const [revealStamp, setRevealStamp] = useState<number | null>(null);

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

  // Derive the most active TxStatus for the global toast
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

  const referralLink = typeof window !== "undefined" && address ? `${window.location.origin}?ref=${address}` : "";
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
          <div className="flex items-center gap-3 mb-8">
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

        <div className="space-y-3 mb-10">
          {QUESTS.map((quest) => {
            const completed = progress.find((p) => p.questId === quest.id)?.completed ?? false;
            const qStatus = questStatus[quest.id] ?? "idle";
            const qError = questError[quest.id] ?? null;
            const Icon = ICON_MAP[quest.icon] ?? Ticket;
            const qLoading = qStatus === "signing" || qStatus === "pending";

            // Disable referral if no referrals yet
            const disabled = quest.id === 5 && referralCount === 0 && !completed;
            const label = quest.id === 5 && referralCount === 0 ? "No referrals yet" : undefined;

            return (
              <QuestCard
                key={quest.id}
                title={quest.title}
                description={quest.description}
                points={quest.points}
                icon={Icon}
                completed={completed}
                onAction={() => completeQuest(quest.id)}
                actionLabel={label ?? (completed ? "Completed" : "Complete Quest")}
                loading={qLoading}
                disabled={disabled || quest.id === 2} // toss predict needs verificationData UI
                status={qStatus}
                errorMessage={qError}
              >
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
