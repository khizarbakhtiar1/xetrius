/**
 * In-memory vote tracking for fan polls.
 * Keyed by `${userAddress}:${matchId}` → vote choice.
 *
 * For production, replace with a persistent store (DB / Redis).
 */

const votes = new Map<string, string>();

function key(userAddress: string, matchId: number): string {
  return `${userAddress.toLowerCase()}:${matchId}`;
}

export function recordVote(userAddress: string, matchId: number, choice: string): void {
  votes.set(key(userAddress, matchId), choice);
}

export function hasVoted(userAddress: string, matchId: number): boolean {
  return votes.has(key(userAddress, matchId));
}

export function getVote(userAddress: string, matchId: number): string | undefined {
  return votes.get(key(userAddress, matchId));
}
