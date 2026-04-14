"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, type LucideIcon } from "lucide-react";
import type { TxStatus } from "@/types";

interface QuestCardProps {
  title: string;
  description: string;
  points: number;
  icon: LucideIcon;
  completed: boolean;
  onAction: () => void;
  actionLabel: string;
  loading?: boolean;
  disabled?: boolean;
  status?: TxStatus;
  errorMessage?: string | null;
  children?: React.ReactNode;
}

export function QuestCard({
  title,
  description,
  points,
  icon: Icon,
  completed,
  onAction,
  actionLabel,
  loading,
  disabled,
  status,
  errorMessage,
  children,
}: QuestCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-xl border p-5 transition-all",
        completed
          ? "bg-white/[0.02] border-white/10"
          : "bg-card border-card-border hover:border-white/15"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            completed ? "bg-green-500/10 text-green-400" : "bg-white/5 text-muted"
          )}
        >
          {completed ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn("font-semibold text-sm", completed && "text-muted line-through")}>
              {title}
            </h3>
            <span className="text-xs font-bold text-accent">+{points} pts</span>
          </div>
          <p className="text-xs text-muted mt-1">{description}</p>

          {children && <div className="mt-3">{children}</div>}

          {errorMessage && status === "error" && (
            <p className="mt-2 text-xs text-red-400 font-medium">{errorMessage}</p>
          )}

          {!completed && (
            <button
              onClick={onAction}
              disabled={loading || disabled}
              className={cn(
                "mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                "bg-white text-black hover:bg-white/90",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              {loading && <Loader2 className="w-3 h-3 animate-spin" />}
              {actionLabel}
            </button>
          )}

          {completed && (
            <p className="mt-2 text-xs text-green-400 font-medium">Completed</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
