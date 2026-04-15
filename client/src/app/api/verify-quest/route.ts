import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { signQuestProof, logSigningEvent } from "@/lib/signer";
import { verifyHasPass, getReferralCount } from "@/lib/chain-reader";
import { hasVoted } from "@/lib/vote-store";
import { getTossResult, getMatchWindow } from "@/lib/matches";
import { logger } from "@/lib/logger";

// ── Rate Limiting (in-memory, good enough for hackathon) ────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(userAddress: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userAddress);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userAddress, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// ── Zod Schemas ─────────────────────────────────────────────────────

const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;

const baseSchema = z.object({
  userAddress: z.string().regex(evmAddressRegex, "Invalid EVM address"),
  questId: z.number().int().min(1).max(5),
  matchId: z.number().int().min(0),
  verificationData: z.unknown(),
});

const tossVerificationSchema = z.object({
  predictedWinner: z.enum(["A", "B"]),
});

// ── Quest Verification Handlers ─────────────────────────────────────

async function verifyTeamPass(userAddress: string): Promise<string | null> {
  const hasPas = await verifyHasPass(userAddress);
  if (!hasPas) return "You don't have a Team Pass";
  return null;
}

function verifyTossPrediction(
  verificationData: unknown,
  matchId: number
): string | null {
  const tossData = tossVerificationSchema.safeParse(verificationData);
  if (!tossData.success) {
    return "verificationData must include predictedWinner: 'A' | 'B'";
  }

  const correctResult = getTossResult(matchId);
  if (!correctResult) return "No toss result available for this match";
  if (tossData.data.predictedWinner !== correctResult) return "Incorrect toss prediction";
  return null;
}

function verifyMatchCheckin(matchId: number): string | null {
  const window = getMatchWindow(matchId);
  if (!window) return "No match window configured for this match";

  const now = Date.now();
  if (now < window.start || now > window.end) {
    return "Check-in is only available during the match window";
  }
  return null;
}

function verifyFanVote(userAddress: string, matchId: number): string | null {
  if (!hasVoted(userAddress, matchId)) {
    return "You must vote in the fan poll before completing this quest";
  }
  return null;
}

async function verifyReferral(userAddress: string): Promise<string | null> {
  const count = await getReferralCount(userAddress);
  if (count < 1) return "You need at least one referral to complete this quest";
  return null;
}

// ── Error code mapping ──────────────────────────────────────────────

const ERROR_CODES: Record<number, string> = {
  1: "NO_PASS",
  2: "TOSS_FAILED",
  3: "CHECKIN_FAILED",
  4: "VOTE_REQUIRED",
  5: "NO_REFERRALS",
};

// ── Route Handler ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = baseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { userAddress, questId, matchId, verificationData } = parsed.data;

    if (isRateLimited(userAddress)) {
      return NextResponse.json(
        { error: "Too many requests. Try again in a minute.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    // ── Quest-specific verification ─────────────────────────────────

    let errorMsg: string | null = null;

    switch (questId) {
      case 1:
        errorMsg = await verifyTeamPass(userAddress);
        break;
      case 2:
        errorMsg = verifyTossPrediction(verificationData, matchId);
        break;
      case 3:
        errorMsg = verifyMatchCheckin(matchId);
        break;
      case 4:
        errorMsg = verifyFanVote(userAddress, matchId);
        break;
      case 5:
        errorMsg = await verifyReferral(userAddress);
        break;
      default:
        return NextResponse.json(
          { error: "Unknown quest", code: "UNKNOWN_QUEST" },
          { status: 400 }
        );
    }

    if (errorMsg) {
      logSigningEvent(userAddress, questId, matchId, false);
      return NextResponse.json(
        { error: errorMsg, code: ERROR_CODES[questId] ?? "VERIFICATION_FAILED" },
        { status: 403 }
      );
    }

    // ── Sign the proof ──────────────────────────────────────────────

    const proof = await signQuestProof(userAddress, questId, matchId);
    logSigningEvent(userAddress, questId, matchId, true);

    return NextResponse.json({ proof, questId, matchId });
  } catch (err) {
    logger.error("verify-quest error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
    { status: 405 }
  );
}
