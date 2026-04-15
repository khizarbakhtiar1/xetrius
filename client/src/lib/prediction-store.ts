/**
 * In-memory store for match winner predictions.
 * Same caveat as vote-store: resets on server restart. Fine for hackathon.
 */

interface Prediction {
  choice: "A" | "B";
  timestamp: number;
}

const predictions = new Map<string, Prediction>();

function key(userAddress: string, matchId: number): string {
  return `${userAddress.toLowerCase()}:${matchId}`;
}

export function recordPrediction(
  userAddress: string,
  matchId: number,
  choice: "A" | "B"
): void {
  predictions.set(key(userAddress, matchId), {
    choice,
    timestamp: Date.now(),
  });
}

export function hasPredicted(userAddress: string, matchId: number): boolean {
  return predictions.has(key(userAddress, matchId));
}

export function getPrediction(
  userAddress: string,
  matchId: number
): Prediction | undefined {
  return predictions.get(key(userAddress, matchId));
}
