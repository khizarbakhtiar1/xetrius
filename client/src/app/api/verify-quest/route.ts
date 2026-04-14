import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { signQuestProof, logSigningEvent } from "@/lib/signer";
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

// ── Match Result Config (hardcoded / env for hackathon) ─────────────

function getTossResult(matchId: number): "A" | "B" | null {
  const results: Record<string, string> = {};
  const envResults = process.env.TOSS_RESULTS;
  if (envResults) {
    for (const pair of envResults.split(",")) {
      const [id, winner] = pair.split(":");
      if (id && winner) results[id.trim()] = winner.trim();
    }
  }

  // Fallback: match 1 = A wins
  if (Object.keys(results).length === 0) {
    results["1"] = "A";
  }

  const result = results[String(matchId)];
  if (result === "A" || result === "B") return result;
  return null;
}

function getMatchWindow(matchId: number): { start: number; end: number } | null {
  const startEnv = process.env[`MATCH_${matchId}_START`];
  if (startEnv) {
    const start = Number(startEnv);
    return { start, end: start + 6 * 60 * 60 * 1000 }; // 6 hour window
  }

  // Fallback: match 1 window is always open for hackathon demo
  if (matchId === 1) {
    const now = Date.now();
    return { start: now - 3 * 60 * 60 * 1000, end: now + 3 * 60 * 60 * 1000 };
  }
  return null;
}

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

    if (questId === 2) {
      // Toss Prediction
      const tossData = tossVerificationSchema.safeParse(verificationData);
      if (!tossData.success) {
        return NextResponse.json(
          { error: "verificationData must include predictedWinner: 'A' | 'B'", code: "INVALID_VERIFICATION_DATA" },
          { status: 400 }
        );
      }

      const correctResult = getTossResult(matchId);
      if (!correctResult) {
        return NextResponse.json(
          { error: "No toss result available for this match", code: "NO_RESULT" },
          { status: 404 }
        );
      }

      if (tossData.data.predictedWinner !== correctResult) {
        logSigningEvent(userAddress, questId, matchId, false);
        return NextResponse.json(
          { error: "Incorrect toss prediction", code: "INCORRECT_PREDICTION" },
          { status: 403 }
        );
      }
    } else if (questId === 3) {
      // Match Check-in — verify timestamp is within match window
      const window = getMatchWindow(matchId);
      if (!window) {
        return NextResponse.json(
          { error: "No match window configured for this match", code: "NO_MATCH_WINDOW" },
          { status: 404 }
        );
      }

      const now = Date.now();
      if (now < window.start || now > window.end) {
        logSigningEvent(userAddress, questId, matchId, false);
        return NextResponse.json(
          { error: "Check-in is only available during the match window", code: "OUTSIDE_WINDOW" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "This quest does not require backend verification", code: "NO_PROOF_NEEDED" },
        { status: 400 }
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
