"use client";

import { useAccount, useReadContract } from "wagmi";
import { useTeamPass, useFanWars } from "@/hooks";
import { ADDRESSES, MISSION_STAMPS_ABI } from "@/lib/contracts";
import { getTeamById } from "@/lib/teams";
import { shortenAddress } from "@/lib/utils";
import { StampBadge } from "@/components/StampBadge";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Trophy, Star, Calendar } from "lucide-react";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { hasPass, teamId, referralCount } = useTeamPass();
  const { fanScore } = useFanWars();
  const team = teamId !== null ? getTeamById(teamId) : null;

  const { data: stampCountData } = useReadContract({
    address: ADDRESSES.missionStamps,
    abi: MISSION_STAMPS_ABI,
    functionName: "stampCount",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const stampIds = [1, 2, 3, 4, 5] as const;
  const stamp1 = useReadContract({ address: ADDRESSES.missionStamps, abi: MISSION_STAMPS_ABI, functionName: "balanceOf", args: address ? [address, 1n] : undefined, query: { enabled: !!address } });
  const stamp2 = useReadContract({ address: ADDRESSES.missionStamps, abi: MISSION_STAMPS_ABI, functionName: "balanceOf", args: address ? [address, 2n] : undefined, query: { enabled: !!address } });
  const stamp3 = useReadContract({ address: ADDRESSES.missionStamps, abi: MISSION_STAMPS_ABI, functionName: "balanceOf", args: address ? [address, 3n] : undefined, query: { enabled: !!address } });
  const stamp4 = useReadContract({ address: ADDRESSES.missionStamps, abi: MISSION_STAMPS_ABI, functionName: "balanceOf", args: address ? [address, 4n] : undefined, query: { enabled: !!address } });
  const stamp5 = useReadContract({ address: ADDRESSES.missionStamps, abi: MISSION_STAMPS_ABI, functionName: "balanceOf", args: address ? [address, 5n] : undefined, query: { enabled: !!address } });

  const balances = [stamp1, stamp2, stamp3, stamp4, stamp5].map((s, i) => ({
    id: stampIds[i],
    balance: s.data ? Number(s.data) : 0,
  }));

  const totalStamps = stampCountData ? Number(stampCountData) : 0;

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <p className="text-muted text-sm">Connect your wallet to view your profile</p>
      </div>
    );
  }

  if (!hasPass) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <p className="text-muted text-sm mb-4">Mint a Team Pass to create your profile</p>
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold">
          Get Started <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            {team && (
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                style={{ backgroundColor: team.primaryColor + "15" }}
              >
                <Image src={team.logo} alt={team.name} width={52} height={52} className="object-contain" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg">{team?.name ?? "Fan"}</p>
              {address && <p className="text-sm text-muted">{shortenAddress(address)}</p>}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-accent" />
                  <span className="text-sm font-bold">{fanScore.toLocaleString()}</span>
                  <span className="text-xs text-muted">pts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-bold">{totalStamps}</span>
                  <span className="text-xs text-muted">stamps</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-bold">{referralCount}</span>
                  <span className="text-xs text-muted">referrals</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-bold mb-4">Stamp Collection</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-8">
          {balances.map((s) => (
            <StampBadge key={s.id} stampId={s.id} owned={s.balance > 0} count={s.balance} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/quests" className="flex items-center gap-3 p-4 rounded-xl bg-card border border-card-border hover:border-white/15 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center"><Star className="w-5 h-5 text-muted" /></div>
            <div><p className="text-sm font-semibold">Quests</p><p className="text-xs text-muted">Complete missions</p></div>
          </Link>
          <Link href="/leaderboard" className="flex items-center gap-3 p-4 rounded-xl bg-card border border-card-border hover:border-white/15 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center"><Trophy className="w-5 h-5 text-muted" /></div>
            <div><p className="text-sm font-semibold">Leaderboard</p><p className="text-xs text-muted">See your rank</p></div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
