import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  recordPrediction,
  hasPredicted,
  getPrediction,
} from "@/lib/prediction-store";
import { getMatchById } from "@/lib/matches";

const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;

const postSchema = z.object({
  userAddress: z.string().regex(evmAddressRegex, "Invalid address"),
  matchId: z.number().int().min(1),
  choice: z.enum(["A", "B"]),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid input",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const { userAddress, matchId, choice } = parsed.data;

    if (hasPredicted(userAddress, matchId)) {
      return NextResponse.json(
        { error: "Already predicted for this match", code: "ALREADY_PREDICTED" },
        { status: 409 }
      );
    }

    const match = getMatchById(matchId);
    if (!match) {
      return NextResponse.json(
        { error: "Match not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (match.status !== "upcoming") {
      return NextResponse.json(
        {
          error: "Predictions are locked once the match starts",
          code: "MATCH_STARTED",
        },
        { status: 403 }
      );
    }

    recordPrediction(userAddress, matchId, choice);

    return NextResponse.json({
      predicted: true,
      matchId,
      choice,
    });
  } catch {
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
      {
        error: "userAddress and matchId query parameters required",
        code: "VALIDATION_ERROR",
      },
      { status: 400 }
    );
  }

  if (!evmAddressRegex.test(userAddress)) {
    return NextResponse.json(
      { error: "Invalid address format", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const matchId = Number(matchIdParam);
  if (!Number.isInteger(matchId) || matchId < 1) {
    return NextResponse.json(
      { error: "Invalid matchId", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const pred = getPrediction(userAddress, matchId);
  return NextResponse.json({
    predicted: !!pred,
    choice: pred?.choice ?? null,
    matchId,
  });
}
