import type { Quest } from "@/types";

export const QUESTS: Quest[] = [
  {
    id: 1,
    title: "Mint Team Pass",
    description: "Claim your franchise allegiance and earn your first mission stamp",
    points: 10,
    stampId: 1,
    requiresProof: true,
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
    requiresProof: true,
    icon: "vote",
  },
  {
    id: 6,
    title: "Predict Match Winner",
    description: "Predict which team wins the match before it starts",
    points: 35,
    stampId: 6,
    requiresProof: true,
    icon: "target",
  },
  {
    id: 7,
    title: "Watch Party Check-in",
    description: "Check in while a match is live — prove you're watching",
    points: 20,
    stampId: 7,
    requiresProof: true,
    icon: "tv",
  },
  {
    id: 8,
    title: "Superfan",
    description: "Complete all 5 base quests for a match to earn the Superfan stamp",
    points: 50,
    stampId: 8,
    requiresProof: true,
    icon: "star",
  },
  {
    id: 5,
    title: "Refer a Fan",
    description: "Share your referral link — when someone mints, claim your stamp",
    points: 30,
    stampId: 5,
    requiresProof: true,
    icon: "users",
  },
];

export function getQuestById(id: number): Quest | undefined {
  return QUESTS.find((q) => q.id === id);
}

export const ACTIVE_MATCH_ID = Number(process.env.NEXT_PUBLIC_ACTIVE_MATCH_ID ?? "23");
