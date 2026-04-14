"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const STAMP_META: Record<number, { label: string; emoji: string }> = {
  1: { label: "Team Pass", emoji: "🎫" },
  2: { label: "Toss Oracle", emoji: "🪙" },
  3: { label: "Check-in", emoji: "📍" },
  4: { label: "Fan Voter", emoji: "🗳️" },
  5: { label: "Recruiter", emoji: "🤝" },
};

interface StampBadgeProps {
  stampId: number;
  owned: boolean;
  count?: number;
}

export function StampBadge({ stampId, owned, count = 0 }: StampBadgeProps) {
  const meta = STAMP_META[stampId] ?? { label: `Stamp #${stampId}`, emoji: "⭐" };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={owned ? { scale: 1.05 } : undefined}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
        owned ? "bg-white/[0.03] border-white/15" : "bg-card border-card-border opacity-40"
      )}
    >
      <div className="text-3xl">{meta.emoji}</div>
      <p className="text-xs font-semibold text-center">{meta.label}</p>
      {owned && count > 0 && (
        <span className="text-[10px] font-bold text-accent">x{count}</span>
      )}
      {!owned && <span className="text-[10px] text-muted">Locked</span>}
    </motion.div>
  );
}
