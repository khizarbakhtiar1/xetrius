"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import {
  ADDRESSES,
  QUEST_ENGINE_ABI,
  MISSION_STAMPS_ABI,
  QUEST_IDS,
} from "@/lib/contracts";
import { QUESTS, ACTIVE_MATCH_ID } from "@/lib/quests";
import { useErrorToast } from "./useErrorToast";
import { logger } from "@/lib/logger";
import type { FanProgress, Stamp, TxStatus, VerifyQuestResponse, ApiError } from "@/types";

type QuestStatusMap = Record<number, TxStatus>;
type QuestErrorMap = Record<number, string | null>;

export function useQuests() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { handleError } = useErrorToast();
  const activeMatchId = ACTIVE_MATCH_ID;

  const [questStatus, setQuestStatus] = useState<QuestStatusMap>({});
  const [questError, setQuestError] = useState<QuestErrorMap>({});
  const [stamps, setStamps] = useState<Stamp[]>([]);

  // ── Read: getUserProgress ─────────────────────────────────────────

  const { data: progressRaw, queryKey: progressKey } = useReadContract({
    address: ADDRESSES.questEngine,
    abi: QUEST_ENGINE_ABI,
    functionName: "getUserProgress",
    args: address ? [address, BigInt(activeMatchId)] : undefined,
    query: { enabled: !!address },
  });

  const progress: FanProgress[] = useMemo(() => {
    const bools = progressRaw as readonly boolean[] | undefined;
    return QUESTS.map((quest, i) => ({
      questId: quest.id,
      completed: bools ? bools[i] ?? false : false,
    }));
  }, [progressRaw]);

  // ── Read: stamp balances ──────────────────────────────────────────

  const stampIds = [1, 2, 3, 4, 5] as const;

  const stamp1 = useReadContract({
    address: ADDRESSES.missionStamps,
    abi: MISSION_STAMPS_ABI,
    functionName: "balanceOf",
    args: address ? [address, 1n] : undefined,
    query: { enabled: !!address },
  });
  const stamp2 = useReadContract({
    address: ADDRESSES.missionStamps,
    abi: MISSION_STAMPS_ABI,
    functionName: "balanceOf",
    args: address ? [address, 2n] : undefined,
    query: { enabled: !!address },
  });
  const stamp3 = useReadContract({
    address: ADDRESSES.missionStamps,
    abi: MISSION_STAMPS_ABI,
    functionName: "balanceOf",
    args: address ? [address, 3n] : undefined,
    query: { enabled: !!address },
  });
  const stamp4 = useReadContract({
    address: ADDRESSES.missionStamps,
    abi: MISSION_STAMPS_ABI,
    functionName: "balanceOf",
    args: address ? [address, 4n] : undefined,
    query: { enabled: !!address },
  });
  const stamp5 = useReadContract({
    address: ADDRESSES.missionStamps,
    abi: MISSION_STAMPS_ABI,
    functionName: "balanceOf",
    args: address ? [address, 5n] : undefined,
    query: { enabled: !!address },
  });

  const stampBalances = useMemo(
    () =>
      [stamp1, stamp2, stamp3, stamp4, stamp5].map((s, i) => ({
        id: stampIds[i],
        balance: s.data ? Number(s.data) : 0,
        refetch: s.refetch,
      })),
    [stamp1.data, stamp2.data, stamp3.data, stamp4.data, stamp5.data]
  );

  // ── Write: completeQuest ──────────────────────────────────────────

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
  } = useWaitForTransactionReceipt({ hash: txHash });

  // Track which quest is currently being completed
  const [activeQuestId, setActiveQuestId] = useState<number | null>(null);

  // ── Status management ─────────────────────────────────────────────

  const updateStatus = useCallback((questId: number, newStatus: TxStatus, errorMsg?: string) => {
    setQuestStatus((prev) => ({ ...prev, [questId]: newStatus }));
    if (errorMsg) {
      setQuestError((prev) => ({ ...prev, [questId]: errorMsg }));
    }
    if (newStatus === "confirmed" || newStatus === "error") {
      setTimeout(() => {
        setQuestStatus((prev) => ({ ...prev, [questId]: "idle" }));
        setQuestError((prev) => ({ ...prev, [questId]: null }));
      }, 2000);
    }
  }, []);

  useEffect(() => {
    if (activeQuestId === null) return;
    if (isWritePending) updateStatus(activeQuestId, "pending");
    else if (isConfirming) updateStatus(activeQuestId, "pending");
    else if (isSuccess) {
      updateStatus(activeQuestId, "confirmed");
      queryClient.invalidateQueries({ queryKey: progressKey });
      stampBalances.forEach((s) => s.refetch());
      setActiveQuestId(null);
    }
  }, [isWritePending, isConfirming, isSuccess, activeQuestId]);

  useEffect(() => {
    if (writeError && activeQuestId !== null) {
      const message = handleError(writeError);
      updateStatus(activeQuestId, "error", message);
      setActiveQuestId(null);
    }
  }, [writeError, activeQuestId, handleError]);

  // ── Core action ───────────────────────────────────────────────────

  const completeQuest = useCallback(
    async (questId: number, verificationData?: unknown) => {
      if (!address) return;
      resetWrite();
      setActiveQuestId(questId);
      setQuestError((prev) => ({ ...prev, [questId]: null }));

      const quest = QUESTS.find((q) => q.id === questId);
      if (!quest) {
        updateStatus(questId, "error", "Quest not found");
        return;
      }

      let proof: `0x${string}` = "0x";

      if (quest.requiresProof) {
        updateStatus(questId, "signing");
        try {
          const response = await fetch("/api/verify-quest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userAddress: address,
              questId,
              matchId: activeMatchId,
              verificationData,
            }),
          });

          if (!response.ok) {
            const errorBody: unknown = await response.json().catch(() => null);
            const apiError = errorBody as ApiError | null;
            updateStatus(
              questId,
              "error",
              apiError?.error ?? `Verification failed (${response.status})`
            );
            return;
          }

          const data = (await response.json()) as VerifyQuestResponse;
          proof = data.proof as `0x${string}`;
        } catch (networkError) {
          logger.error('Quest verification network error:', networkError);
          const msg =
            networkError instanceof Error
              ? networkError.message
              : "Network error during verification";
          updateStatus(questId, "error", msg);
          return;
        }
      }

      // Determine matchId based on quest type
      const matchId =
        questId === QUEST_IDS.TOSS_PREDICT || questId === QUEST_IDS.MATCH_CHECKIN
          ? BigInt(activeMatchId)
          : 0n;

      updateStatus(questId, "pending");
      writeContract({
        address: ADDRESSES.questEngine,
        abi: QUEST_ENGINE_ABI,
        functionName: "completeQuest",
        args: [BigInt(questId), matchId, proof],
      });
    },
    [address, activeMatchId, writeContract, resetWrite, updateStatus]
  );

  // ── Loading ───────────────────────────────────────────────────────

  const isLoading = isWritePending || isConfirming;

  return {
    progress,
    stamps,
    stampBalances,
    completeQuest,
    activeMatchId,
    isLoading,
    questStatus,
    questError,
  };
}
