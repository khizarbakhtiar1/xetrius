"use client";

import { useMatch } from "@/hooks";
import { LiveScoreBar } from "./LiveScoreBar";

export function LiveScoreWrapper() {
  const { liveMatch, match } = useMatch();
  const displayMatch = liveMatch ?? (match?.status === "completed" ? match : null);
  return <LiveScoreBar match={displayMatch} />;
}
