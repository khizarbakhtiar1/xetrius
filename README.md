# Xetrius

Xetrius is a **PSL fan quest platform** for the **WireFluid** EVM network: soulbound team passes, on-chain quests, ERC-1155 mission stamps, and team/fan leaderboards. This repository contains the **Solidity contracts** (Foundry) and the **Next.js** web app.

Official WireFluid testnet parameters: [Configure WireFluid Network](https://docs.wirefluid.com/developer-guide/prerequisites/network-config) (chain id **92533**, RPC `https://evm.wirefluid.com`, explorer [wirefluidscan.com](https://wirefluidscan.com/)).

---

## Repository layout

| Directory | Description |
|-----------|-------------|
| **`contracts/`** | `TeamPass`, `MissionStamps`, `QuestEngine`, `FanWars`; Foundry tests; deploy script |
| **`client/`** | Next.js 16 dApp (Wagmi, viem), API routes for quest verification |

---

## How it works (short)

1. A fan connects a wallet (injected / browser wallet) on **WireFluid Testnet**.
2. They **mint a Team Pass** (soulbound ERC-721) for one of eight franchises.
3. They complete **quests** via `QuestEngine`: some quests need a **backend ECDSA proof** from `/api/verify-quest`, which must match the on-chain **`trustedSigner`**.
4. Completing a quest **mints a stamp** (ERC-1155) and **adds points** in `FanWars` for leaderboards.

For a deeper technical walkthrough (including sequence diagrams), create or open the gitignored folder **`internal-docs/`** (see `.gitignore`) — files there are meant for local use only.

---

## Prerequisites

- **Node.js 20+** (22 recommended for Docker)
- **Foundry** (`forge`, `cast`) for contracts
- A wallet funded with **WIRE** on WireFluid testnet ([faucet](https://docs.wirefluid.com/developer-guide/prerequisites/testnet-tokens))

---

## Smart contracts

```bash
cd contracts
forge build
forge test
```

Deploy to WireFluid (set `PRIVATE_KEY`, `RPC_URL_WIREFLUID`, and optional `VERIFIER_ADDRESS` in `.env`; see `contracts/.env.example`):

```bash
cd contracts
make deploy-wirefluid
```

The script broadcasts `script/Deploy.s.sol:DeployXetrius` and attempts verification (`--verify`). If verification fails, add the correct Blockscout / WireFluid verifier configuration to `foundry.toml` or verify manually on the explorer.

**Important:** The **`VERIFIER_ADDRESS`** (or deployer default) must match the address derived from **`SIGNER_PRIVATE_KEY`** in the Next.js server environment, or proof-based quests will revert with `InvalidProof`.

---

## Web client

### Environment variables

Copy `client/.env.example` to `client/.env.local` and fill in values.

| Variable | Scope | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_TEAM_PASS_ADDRESS` | Public | Deployed `TeamPass` |
| `NEXT_PUBLIC_MISSION_STAMPS_ADDRESS` | Public | Deployed `MissionStamps` |
| `NEXT_PUBLIC_QUEST_ENGINE_ADDRESS` | Public | Deployed `QuestEngine` |
| `NEXT_PUBLIC_FAN_WARS_ADDRESS` | Public | Deployed `FanWars` |
| `NEXT_PUBLIC_RPC_URL_WIREFLUID` | Public | Defaults to `https://evm.wirefluid.com` |
| `NEXT_PUBLIC_ACTIVE_MATCH_ID` | Public | Active match id for per-match quests |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Public | Optional; app uses injected wallet by default |
| `SIGNER_PRIVATE_KEY` | **Server only** | Signs quest proofs for `/api/verify-quest` |
| `TOSS_RESULTS` | Server | Optional, e.g. `1:A,2:B` for toss outcomes |
| `MATCH_<id>_START` | Server | Unix ms start for match check-in windows |

Never commit `.env` or `.env.local`.

### Commands

```bash
cd client
npm ci
npm run dev
```

Quality gate (lint, types, production build):

```bash
cd client
npm run lint
npm run typecheck
npm run build
```

---

## Production deployment (overview)

### Option A: Node / VPS

1. Set environment variables on the host (all `NEXT_PUBLIC_*` and `SIGNER_PRIVATE_KEY`).
2. `cd client && npm ci && npm run build && npm run start` (default port **3000**).

Use a reverse proxy (TLS, HTTP/2) in front of the Node process.

### Option B: Docker

From `client/`, pass **build args** for every `NEXT_PUBLIC_*` value so they are embedded in the client bundle. At **runtime**, provide **`SIGNER_PRIVATE_KEY`** (and any server-only vars) via `--env-file` or orchestrator secrets.

```bash
cd client
docker build \
  --build-arg NEXT_PUBLIC_TEAM_PASS_ADDRESS=0x... \
  --build-arg NEXT_PUBLIC_MISSION_STAMPS_ADDRESS=0x... \
  --build-arg NEXT_PUBLIC_QUEST_ENGINE_ADDRESS=0x... \
  --build-arg NEXT_PUBLIC_FAN_WARS_ADDRESS=0x... \
  -t xetrius-client .
docker run -p 3000:3000 --env-file .env.production xetrius-client
```

The image uses Next.js **`output: "standalone"`** (see `client/next.config.ts`).

### Option C: Vercel (or similar)

Connect the **`client`** directory as the app root. Configure the same env vars in the project settings. Ensure serverless functions receive **`SIGNER_PRIVATE_KEY`** securely.

---

## Testing summary

| Layer | Command | Status |
|-------|---------|--------|
| Contracts | `cd contracts && forge test` | 36 tests |
| Client | `cd client && npm run lint && npm run typecheck && npm run build` | CI-style gate |

---

## Security notes

- **`SIGNER_PRIVATE_KEY`** is highly sensitive: it authorizes proof-based quest completion. Rotate if leaked; update `QuestEngine.setTrustedSigner` from the contract owner if the address changes.
- `/api/verify-quest` uses **in-memory rate limiting**; scale-out deployments should replace this with a shared limiter or edge protection.

---

## License and branding

Smart contracts use MIT SPDX headers. Metadata URIs and UI copy reference PSL / franchise themes; update hosts (e.g. `xetrius.io` in stamp URIs) when you finalize production domains.
