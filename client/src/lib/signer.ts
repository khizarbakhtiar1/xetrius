import { ethers } from "ethers";
import { logger } from "./logger";

const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;

function getWallet(): ethers.Wallet {
  if (!SIGNER_PRIVATE_KEY) {
    throw new Error("SIGNER_PRIVATE_KEY is not configured");
  }
  return new ethers.Wallet(SIGNER_PRIVATE_KEY);
}

/**
 * Produces a backend ECDSA signature for quest proof verification.
 * Signs: keccak256(abi.encodePacked(userAddress, questId, matchId))
 * This matches the on-chain verification in QuestEngine.completeQuest().
 */
export async function signQuestProof(
  userAddress: string,
  questId: number,
  matchId: number
): Promise<string> {
  const wallet = getWallet();

  const messageHash = ethers.solidityPackedKeccak256(
    ["address", "uint256", "uint256"],
    [userAddress, questId, matchId]
  );

  const signature = await wallet.signMessage(ethers.getBytes(messageHash));
  return signature;
}

/**
 * Logs a signing event without exposing sensitive data.
 */
export function logSigningEvent(
  userAddress: string,
  questId: number,
  matchId: number,
  success: boolean
): void {
  logger.info("quest_proof_signed", { userAddress, questId, matchId, success });
}
