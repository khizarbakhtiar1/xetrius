import type { Quest } from "@/types";

export const QUESTS: Quest[] = [
  {
    id: 1,
    title: "Mint Team Pass",
    description: "Claim your franchise allegiance and earn your first mission stamp",
    points: 10,
    stampId: 1,
    requiresProof: false,
    icon: "ticket",
  },
  {
    id: 2,
    title: "Predict Toss Winner",
    description: "Predict who wins the coin toss before the match — verified by oracle",
    points: 25,
    stampId: 2,
    requiresProof: true,
    icon: "coins",
  },
  {
    id: 3,
    title: "Match Day Check-in",
    description: "Check in during a live match window to earn your stamp",
    points: 15,
    stampId: 3,
    requiresProof: true,
    icon: "map-pin",
  },
  {
    id: 4,
    title: "Vote in Fan Poll",
    description: "Cast your vote in the active PSL fan poll",
    points: 15,
    stampId: 4,
    requiresProof: false,
    icon: "vote",
  },
  {
    id: 5,
    title: "Refer a Fan",
    description: "Share your referral link — when someone mints, claim your stamp",
    points: 30,
    stampId: 5,
    requiresProof: false,
    icon: "users",
  },
];

export function getQuestById(id: number): Quest | undefined {
  return QUESTS.find((q) => q.id === id);
}

export const ACTIVE_MATCH_ID = Number(process.env.NEXT_PUBLIC_ACTIVE_MATCH_ID ?? "1");
