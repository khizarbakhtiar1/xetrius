import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { recordVote, getVote } from "@/lib/vote-store";
import { logger } from "@/lib/logger";

const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;

const POLL_OPTIONS = ["A", "B", "C", "D"] as const;

const voteSchema = z.object({
  userAddress: z.string().regex(evmAddressRegex, "Invalid EVM address"),
  matchId: z.number().int().min(0),
  choice: z.enum(POLL_OPTIONS),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = voteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { userAddress, matchId, choice } = parsed.data;

    const existing = getVote(userAddress, matchId);
    if (existing) {
      return NextResponse.json(
        { error: "You have already voted in this poll", code: "ALREADY_VOTED", choice: existing },
        { status: 409 }
      );
    }

    recordVote(userAddress, matchId, choice);
    logger.info("fan_poll_vote", { userAddress, matchId, choice });

    return NextResponse.json({ success: true, choice, matchId });
  } catch (err) {
    logger.error("fan-poll error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userAddress = searchParams.get("userAddress");
  const matchIdParam = searchParams.get("matchId");

  if (!userAddress || !matchIdParam) {
    return NextResponse.json(
      { error: "userAddress and matchId query parameters required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
    return NextResponse.json(
      { error: "Invalid EVM address", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const matchId = Number(matchIdParam);
  if (!Number.isInteger(matchId) || matchId < 0) {
    return NextResponse.json(
      { error: "matchId must be a non-negative integer", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const vote = getVote(userAddress, matchId);

  return NextResponse.json({
    voted: !!vote,
    choice: vote ?? null,
    matchId,
  });
}
