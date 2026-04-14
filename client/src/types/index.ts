export interface Team {
  id: number;
  name: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface Quest {
  id: number;
  title: string;
  description: string;
  points: number;
  stampId: number;
  requiresProof: boolean;
  icon: string;
}

export interface FanProgress {
  questId: number;
  completed: boolean;
  completedAt?: number;
}

export interface Stamp {
  id: number;
  questId: number;
  matchId: number;
  earnedAt: number;
}

export type TxStatus = "idle" | "signing" | "pending" | "confirmed" | "error";

export interface VerifyQuestRequest {
  userAddress: string;
  questId: number;
  matchId: number;
  verificationData: unknown;
}

export interface VerifyQuestResponse {
  proof: string;
  questId: number;
  matchId: number;
}

export interface ApiError {
  error: string;
  code: string;
}
