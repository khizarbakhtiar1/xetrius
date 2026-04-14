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
  TEAM_PASS_ABI,
  TEAM_CHANGE_COOLDOWN,
} from "@/lib/contracts";
import { useErrorToast } from "./useErrorToast";
import type { TxStatus } from "@/types";

export function useTeamPass() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { handleError } = useErrorToast();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [mintError, setMintError] = useState<Error | null>(null);

  // ── Reads ─────────────────────────────────────────────────────────

  const { data: hasPassRaw, queryKey: hasPassKey } = useReadContract({
    address: ADDRESSES.teamPass,
    abi: TEAM_PASS_ABI,
    functionName: "hasPass",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const hasPass = !!hasPassRaw;

  const { data: teamIdRaw, queryKey: teamIdKey } = useReadContract({
    address: ADDRESSES.teamPass,
    abi: TEAM_PASS_ABI,
    functionName: "getTeam",
    args: address ? [address] : undefined,
    query: { enabled: !!address && hasPass },
  });

  const teamId = teamIdRaw !== undefined ? Number(teamIdRaw) : null;

  const { data: tokenIdRaw, queryKey: tokenIdKey } = useReadContract({
    address: ADDRESSES.teamPass,
    abi: TEAM_PASS_ABI,
    functionName: "passOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const tokenId = tokenIdRaw !== undefined && tokenIdRaw !== 0n ? tokenIdRaw : null;

  const { data: referralCountRaw } = useReadContract({
    address: ADDRESSES.teamPass,
    abi: TEAM_PASS_ABI,
    functionName: "referralCount",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const referralCount = referralCountRaw ? Number(referralCountRaw) : 0;

  // ── Cooldown check ────────────────────────────────────────────────

  const { data: mintTimeRaw } = useReadContract({
    address: ADDRESSES.teamPass,
    abi: TEAM_PASS_ABI,
    functionName: "tokenMintTime",
    args: tokenId !== null ? [tokenId] : undefined,
    query: { enabled: tokenId !== null },
  });

  const { data: lastChangeRaw } = useReadContract({
    address: ADDRESSES.teamPass,
    abi: TEAM_PASS_ABI,
    functionName: "lastTeamChange",
    args: tokenId !== null ? [tokenId] : undefined,
    query: { enabled: tokenId !== null },
  });

  const canChangeTeam = useMemo(() => {
    if (tokenId === null) return false;
    const mintTime = mintTimeRaw ? Number(mintTimeRaw) : 0;
    const lastChange = lastChangeRaw ? Number(lastChangeRaw) : 0;
    const earliest = lastChange > 0 ? lastChange : mintTime;
    if (earliest === 0) return false;
    return Math.floor(Date.now() / 1000) >= earliest + TEAM_CHANGE_COOLDOWN;
  }, [tokenId, mintTimeRaw, lastChangeRaw]);

  // ── Write: mint ───────────────────────────────────────────────────

  const {
    writeContract: writeMint,
    data: mintTxHash,
    isPending: isMintPending,
    error: mintWriteError,
    reset: resetMint,
  } = useWriteContract();

  const {
    isLoading: isMintConfirming,
    isSuccess: isMintSuccess,
  } = useWaitForTransactionReceipt({ hash: mintTxHash });

  // ── Write: changeTeam ─────────────────────────────────────────────

  const {
    writeContract: writeChange,
    data: changeTxHash,
    isPending: isChangePending,
    error: changeWriteError,
    reset: resetChange,
  } = useWriteContract();

  const {
    isLoading: isChangeConfirming,
    isSuccess: isChangeSuccess,
  } = useWaitForTransactionReceipt({ hash: changeTxHash });

  // ── Status tracking ───────────────────────────────────────────────

  useEffect(() => {
    if (isMintPending || isChangePending) setStatus("signing");
    else if (isMintConfirming || isChangeConfirming) setStatus("pending");
    else if (isMintSuccess || isChangeSuccess) {
      setStatus("confirmed");
      const timer = setTimeout(() => setStatus("idle"), 2000);
      return () => clearTimeout(timer);
    } else if (mintWriteError || changeWriteError) {
      setStatus("error");
      const err = mintWriteError ?? changeWriteError;
      const message = handleError(err);
      setMintError(new Error(message));
      const timer = setTimeout(() => {
        setStatus("idle");
        setMintError(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isMintPending, isMintConfirming, isMintSuccess, mintWriteError, isChangePending, isChangeConfirming, isChangeSuccess, changeWriteError]);

  // ── Invalidation on success ───────────────────────────────────────

  useEffect(() => {
    if (isMintSuccess || isChangeSuccess) {
      queryClient.invalidateQueries({ queryKey: hasPassKey });
      queryClient.invalidateQueries({ queryKey: teamIdKey });
      queryClient.invalidateQueries({ queryKey: tokenIdKey });
    }
  }, [isMintSuccess, isChangeSuccess, queryClient, hasPassKey, teamIdKey, tokenIdKey]);

  // ── Actions ───────────────────────────────────────────────────────

  const mintPass = useCallback(
    (selectedTeamId: number, referrer?: string) => {
      setMintError(null);
      resetMint();
      writeMint({
        address: ADDRESSES.teamPass,
        abi: TEAM_PASS_ABI,
        functionName: "mint",
        args: [
          selectedTeamId,
          (referrer ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
        ],
      });
    },
    [writeMint, resetMint]
  );

  const changeTeam = useCallback(
    (newTeamId: number) => {
      setMintError(null);
      resetChange();
      writeChange({
        address: ADDRESSES.teamPass,
        abi: TEAM_PASS_ABI,
        functionName: "changeTeam",
        args: [newTeamId],
      });
    },
    [writeChange, resetChange]
  );

  // ── Loading ───────────────────────────────────────────────────────

  const isLoading = isMintPending || isMintConfirming || isChangePending || isChangeConfirming;

  return {
    hasPass,
    teamId,
    tokenId,
    referralCount,
    canChangeTeam,
    isLoading,
    status,
    mintTxHash: mintTxHash ?? null,
    mintError,
    mintPass,
    changeTeam,
    address,
  };
}
