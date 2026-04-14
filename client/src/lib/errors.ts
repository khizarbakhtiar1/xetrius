import { BaseError, decodeErrorResult, type Abi } from 'viem';
import {
  TEAM_PASS_ABI,
  QUEST_ENGINE_ABI,
  MISSION_STAMPS_ABI,
  FAN_WARS_ABI,
} from './contracts';

export const ERROR_MESSAGES: Record<string, string> = {
  AlreadyHasPass: 'You already have a Fan Pass',
  AlreadyCompleted: 'You already completed this quest for this match',
  QuestInactive: 'This quest is not active right now',
  InvalidProof: 'Verification failed — try again',
  NoPass: 'You need a Fan Pass to do quests',
  NotReady: "You can't change teams yet — 90 day cooldown",
  Soulbound: 'Stamps are non-transferable',
  InvalidTeam: 'Invalid team selection',
  QuestNotFound: 'Quest does not exist',
};

const ALL_ABIS = [TEAM_PASS_ABI, QUEST_ENGINE_ABI, MISSION_STAMPS_ABI, FAN_WARS_ABI];

/**
 * Parses any error thrown during a contract interaction into a
 * human-readable message suitable for display in the UI.
 *
 * Resolution order:
 *  1. User rejection (wallet popup dismissed)
 *  2. Viem BaseError → walk cause chain for revert data → decode against all ABIs
 *  3. String-match known error names in the error message
 *  4. Generic fallback
 */
export function parseContractError(error: unknown): string {
  if (
    error instanceof Error &&
    error.message.toLowerCase().includes('rejected')
  ) {
    return 'You rejected the transaction';
  }

  if (error instanceof BaseError) {
    const revertError = error.walk(
      (e) => (e as { data?: unknown }).data != null
    );

    if (revertError != null) {
      const data = (revertError as { data?: string }).data;
      if (typeof data === 'string' && data.startsWith('0x')) {
        for (const abi of ALL_ABIS) {
          try {
            const decoded = decodeErrorResult({
              abi: abi as unknown as Abi,
              data: data as `0x${string}`,
            });
            return ERROR_MESSAGES[decoded.errorName] ?? decoded.errorName;
          } catch {
            continue;
          }
        }
      }
    }
  }

  if (error instanceof Error) {
    for (const [key, msg] of Object.entries(ERROR_MESSAGES)) {
      if (error.message.includes(key)) return msg;
    }
  }

  return 'Transaction failed — please try again';
}
