import { z } from 'zod';

const evmAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid EVM address (0x + 40 hex chars)');

const emptyToUndefined = z.literal('').transform(() => undefined);
const optionalString = z.union([emptyToUndefined, z.string().min(1)]).optional();
const optionalUrl = z.union([emptyToUndefined, z.string().url()]).optional();

const clientSchema = z.object({
  NEXT_PUBLIC_TEAM_PASS_ADDRESS: evmAddress,
  NEXT_PUBLIC_MISSION_STAMPS_ADDRESS: evmAddress,
  NEXT_PUBLIC_QUEST_ENGINE_ADDRESS: evmAddress,
  NEXT_PUBLIC_FAN_WARS_ADDRESS: evmAddress,
  NEXT_PUBLIC_RPC_URL_WIREFLUID: optionalUrl,
  NEXT_PUBLIC_ACTIVE_MATCH_ID: z.coerce.number().int().min(0).default(23),
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: optionalString,
});

const serverSchema = z.object({
  SIGNER_PRIVATE_KEY: z.string().min(1, 'SIGNER_PRIVATE_KEY is required for quest proof signing'),
  MATCH_SCHEDULE: optionalString,
  CRICAPI_KEY: optionalString,
});

function validateEnv() {
  const clientResult = clientSchema.safeParse({
    NEXT_PUBLIC_TEAM_PASS_ADDRESS: process.env.NEXT_PUBLIC_TEAM_PASS_ADDRESS,
    NEXT_PUBLIC_MISSION_STAMPS_ADDRESS: process.env.NEXT_PUBLIC_MISSION_STAMPS_ADDRESS,
    NEXT_PUBLIC_QUEST_ENGINE_ADDRESS: process.env.NEXT_PUBLIC_QUEST_ENGINE_ADDRESS,
    NEXT_PUBLIC_FAN_WARS_ADDRESS: process.env.NEXT_PUBLIC_FAN_WARS_ADDRESS,
    NEXT_PUBLIC_RPC_URL_WIREFLUID: process.env.NEXT_PUBLIC_RPC_URL_WIREFLUID,
    NEXT_PUBLIC_ACTIVE_MATCH_ID: process.env.NEXT_PUBLIC_ACTIVE_MATCH_ID,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  });

  if (!clientResult.success) {
    const formatted = clientResult.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`[Xetrius] Missing or invalid environment variables:\n${formatted}`);
  }

  let serverEnv: z.infer<typeof serverSchema> | null = null;
  if (typeof window === 'undefined') {
    const serverResult = serverSchema.safeParse({
      SIGNER_PRIVATE_KEY: process.env.SIGNER_PRIVATE_KEY,
      MATCH_SCHEDULE: process.env.MATCH_SCHEDULE,
      CRICAPI_KEY: process.env.CRICAPI_KEY,
    });

    if (!serverResult.success) {
      const formatted = serverResult.error.issues
        .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
        .join('\n');
      throw new Error(`[Xetrius] Missing or invalid server environment variables:\n${formatted}`);
    }
    serverEnv = serverResult.data;
  }

  return { client: clientResult.data, server: serverEnv };
}

export const env = validateEnv();
