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
} from "@/lib/contracts";
import { QUESTS, ACTIVE_MATCH_ID } from "@/lib/quests";
import { useErrorToast } from "./useErrorToast";
import { logger } from "@/lib/logger";
import type { FanProgress, TxStatus, VerifyQuestResponse, ApiError } from "@/types";

type QuestStatusMap = Record<number, TxStatus>;
type QuestErrorMap = Record<number, string | null>;

const STAMP_QUERY_IDS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function useQuests() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { handleError } = useErrorToast();
  const activeMatchId = ACTIVE_MATCH_ID;

  const [questStatus, setQuestStatus] = useState<QuestStatusMap>({});
  const [questError, setQuestError] = useState<QuestErrorMap>({});

  // ── Read: getUserProgress (quests 1-5) ────────────────────────────

  const { data: progressRaw, queryKey: progressKey } = useReadContract({
    address: ADDRESSES.questEngine,
    abi: QUEST_ENGINE_ABI,
    functionName: "getUserProgress",
    args: address ? [address, BigInt(activeMatchId)] : undefined,
    query: { enabled: !!address },
  });

  // Individual reads for quests 6-8 (not covered by getUserProgress)
  const q6 = useReadContract({
    address: ADDRESSES.questEngine,
    abi: QUEST_ENGINE_ABI,
    functionName: "completed",
    args: address ? [address, 6n, BigInt(activeMatchId)] : undefined,
    query: { enabled: !!address },
  });
  const q7 = useReadContract({
    address: ADDRESSES.questEngine,
    abi: QUEST_ENGINE_ABI,
    functionName: "completed",
    args: address ? [address, 7n, BigInt(activeMatchId)] : undefined,
    query: { enabled: !!address },
  });
  const q8 = useReadContract({
    address: ADDRESSES.questEngine,
    abi: QUEST_ENGINE_ABI,
    functionName: "completed",
    args: address ? [address, 8n, BigInt(activeMatchId)] : undefined,
    query: { enabled: !!address },
  });

  const progress: FanProgress[] = useMemo(() => {
    const bools = progressRaw as readonly boolean[] | undefined;
    const extraCompleted: Record<number, boolean> = {
      6: q6.data === true,
      7: q7.data === true,
      8: q8.data === true,
    };
    return QUESTS.map((quest) => ({
      questId: quest.id,
      completed:
        quest.id <= 5
          ? bools
            ? bools[quest.id - 1] ?? false
            : false
          : extraCompleted[quest.id] ?? false,
    }));
  }, [progressRaw, q6.data, q7.data, q8.data]);

  // ── Read: stamp balances ──────────────────────────────────────────

  const stamp1 = useReadContract({ address: ADDRESSES.missionStamps, abi: MISSION_STAMPS_ABI, functionName: "balanceOf", args: address ? [address, 1n] : undefined, query: { enabled: !!address } });
  const stamp2 = useReadContract({ address: ADDRESSES.missionStamps, abi: MISSION_STAMPS_ABI, functionName: "balanceOf", args: address ? [address, 2n] : undefined, query: { enabled: !!address } });
  const stamp3 = useReadContract({ address: ADDRESSES.missionStamps, abi: MISSION_STAMPS_ABI, functionName: "balanceOf", args: address ? [address, 3n] : undefined, query: { enabled: !!address } });
  const stamp4 = useReadContract({ address: ADDRESSES.missionStamps, abi: MISSION_STAMPS_ABI, functionName: "balanceOf", args: address ? [address, 4n] : undefined, query: { enabled: !!address } });
  const stamp5 = useReadContract({ address: ADDRESSES.missionStamps, abi: MISSION_STAMPS_ABI, functionName: "balanceOf", args: address ? [address, 5n] : undefined, query: { enabled: !!address } });
  const stamp6 = useReadContract({ address: ADDRESSES.missionStamps, abi: MISSION_STAMPS_ABI, functionName: "balanceOf", args: address ? [address, 6n] : undefined, query: { enabled: !!address } });
  const stamp7 = useReadContract({ address: ADDRESSES.missionStamps, abi: MISSION_STAMPS_ABI, functionName: "balanceOf", args: address ? [address, 7n] : undefined, query: { enabled: !!address } });
  const stamp8 = useReadContract({ address: ADDRESSES.missionStamps, abi: MISSION_STAMPS_ABI, functionName: "balanceOf", args: address ? [address, 8n] : undefined, query: { enabled: !!address } });

  const stampBalances = useMemo(
    () =>
      [stamp1, stamp2, stamp3, stamp4, stamp5, stamp6, stamp7, stamp8].map((s, i) => ({
        id: STAMP_QUERY_IDS[i],
        balance: s.data ? Number(s.data) : 0,
        refetch: s.refetch,
      })),
    [stamp1, stamp2, stamp3, stamp4, stamp5, stamp6, stamp7, stamp8]
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- single-tx lifecycle for activeQuestId; full deps would over-fire
  }, [isWritePending, isConfirming, isSuccess, activeQuestId]);

  useEffect(() => {
    if (writeError && activeQuestId !== null) {
      const message = handleError(writeError);
      updateStatus(activeQuestId, "error", message);
      setActiveQuestId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- error path only; updateStatus omitted to limit churn
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

      const matchId = BigInt(activeMatchId);

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
    stampBalances,
    completeQuest,
    activeMatchId,
    isLoading,
    questStatus,
    questError,
  };
}
