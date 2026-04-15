"use client";

import { useAccount } from "wagmi";
import { useTeamPass, useMatch } from "@/hooks";
import { TeamSelector } from "@/components/TeamSelector";
import { FixturePreview } from "@/components/FixturePreview";
import { TxToast } from "@/components/TxToast";
import { getTeamById } from "@/lib/teams";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function HomeContent() {
  const { isConnected } = useAccount();
  const {
    hasPass,
    teamId,
    mintPass,
    status,
    mintError,
  } = useTeamPass();
  const { allMatches } = useMatch();

  const searchParams = useSearchParams();
  const refFromQuery = searchParams.get("ref") ?? "";

  const [selected, setSelected] = useState<number | null>(null);
  const [referrer, setReferrer] = useState(refFromQuery);

  const team = teamId !== null ? getTeamById(teamId) : null;

  if (isConnected && hasPass && team) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 pt-10 sm:pt-14 pb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div
            className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center overflow-hidden mb-6"
            style={{ backgroundColor: team.primaryColor + "15" }}
          >
            <Image src={team.logo} alt={team.name} width={64} height={64} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold mb-2">You&apos;re in, {team.name} fan!</h1>
          <p className="text-muted text-sm mb-8">
            Your Team Pass is minted. Start completing quests to earn stamps and climb the leaderboard.
          </p>
          <Link
            href="/quests"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
          >
            Go to Quests <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {allMatches.length > 0 && <FixturePreview matches={allMatches} />}
      </div>
    );
  }

  const isLoading = status === "signing" || status === "pending";

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 pt-10 sm:pt-14 pb-6">
      <TxToast show={status !== "idle"} status={status} message={mintError?.message} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg w-full"
      >
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">PSL Fan Quests</h1>
        <p className="text-muted text-sm sm:text-base mb-10 max-w-sm mx-auto">
          Pick your franchise. Complete onchain missions. Earn stamps. Climb the leaderboard. Rep your team.
        </p>

        {!isConnected ? (
          <div className="bg-card border border-card-border rounded-xl p-8">
            <p className="text-sm text-muted">Connect your wallet to get started</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key="team-select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-card border border-card-border rounded-xl p-6">
                <h2 className="text-lg font-bold mb-1">Choose your franchise</h2>
                <p className="text-xs text-muted mb-5">This is permanent and soulbound to your wallet</p>

                <TeamSelector selected={selected} onSelect={setSelected} disabled={isLoading} />

                {selected !== null && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="mt-4 mb-4">
                      <label className="text-xs text-muted block mb-1">Referrer address (optional)</label>
                      <input
                        type="text"
                        value={referrer}
                        onChange={(e) => setReferrer(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-white/20"
                      />
                    </div>

                    <button
                      onClick={() => mintPass(selected, referrer || undefined)}
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {status === "pending" ? "Confirming..." : "Minting..."}
                        </>
                      ) : (
                        <>Mint Team Pass</>
                      )}
                    </button>
                  </motion.div>
                )}

                {status === "confirmed" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 flex items-center gap-2 text-green-400 text-sm font-medium justify-center"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Team Pass minted!
                  </motion.div>
                )}

                {mintError && (
                  <p className="mt-3 text-xs text-red-400 text-center">{mintError.message}</p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>

      {allMatches.length > 0 && <FixturePreview matches={allMatches} />}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 pt-10 sm:pt-14 pb-6 text-muted text-sm">
          Loading…
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
