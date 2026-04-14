"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { TxStatus } from "@/types";

interface TxToastProps {
  show: boolean;
  status: TxStatus;
  message?: string;
}

const STATUS_CONFIG: Record<TxStatus, { icon: typeof Loader2; className: string; defaultMessage: string }> = {
  idle: { icon: Loader2, className: "text-muted", defaultMessage: "" },
  signing: { icon: Loader2, className: "text-muted animate-spin", defaultMessage: "Waiting for signature..." },
  pending: { icon: Loader2, className: "text-accent animate-spin", defaultMessage: "Confirming transaction..." },
  confirmed: { icon: CheckCircle2, className: "text-green-400", defaultMessage: "Transaction confirmed!" },
  error: { icon: XCircle, className: "text-red-400", defaultMessage: "Transaction failed" },
};

export function TxToast({ show, status, message }: TxToastProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {show && status !== "idle" && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 50, x: "-50%" }}
          className="fixed bottom-6 left-1/2 z-[90] flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-card-border shadow-2xl"
        >
          <Icon className={`w-4 h-4 ${config.className}`} />
          <span className="text-sm font-medium">{message ?? config.defaultMessage}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
