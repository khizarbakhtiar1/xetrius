// All contract addresses in one place — never hardcode in components
export const ADDRESSES = {
  teamPass: (process.env.NEXT_PUBLIC_TEAM_PASS_ADDRESS ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  missionStamps: (process.env.NEXT_PUBLIC_MISSION_STAMPS_ADDRESS ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  questEngine: (process.env.NEXT_PUBLIC_QUEST_ENGINE_ADDRESS ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  fanWars: (process.env.NEXT_PUBLIC_FAN_WARS_ADDRESS ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
} as const;

export const TEAM_PASS_ABI = [
  {
    type: "function", name: "mint", stateMutability: "nonpayable",
    inputs: [{ name: "teamId", type: "uint8" }, { name: "referrer", type: "address" }],
    outputs: [],
  },
  {
    type: "function", name: "hasPass", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function", name: "getTeam", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function", name: "passOf", stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function", name: "teamFanCount", stateMutability: "view",
    inputs: [{ name: "", type: "uint8" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function", name: "referralCount", stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function", name: "totalMinted", stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function", name: "tokenTeam", stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function", name: "tokenMintTime", stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function", name: "lastTeamChange", stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function", name: "changeTeam", stateMutability: "nonpayable",
    inputs: [{ name: "newTeamId", type: "uint8" }],
    outputs: [],
  },
  {
    type: "function", name: "tokenURI", stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "event", name: "TeamPassMinted",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: false },
      { name: "teamId", type: "uint8", indexed: false },
    ],
  },
  {
    type: "error", name: "AlreadyHasPass", inputs: [],
  },
  {
    type: "error", name: "InvalidTeam", inputs: [],
  },
  {
    type: "error", name: "NoPass", inputs: [],
  },
  {
    type: "error", name: "NotReady", inputs: [],
  },
  {
    type: "error", name: "Soulbound", inputs: [],
  },
] as const;

export const MISSION_STAMPS_ABI = [
  {
    type: "function", name: "balanceOf", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }, { name: "id", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function", name: "balanceOfBatch", stateMutability: "view",
    inputs: [{ name: "accounts", type: "address[]" }, { name: "ids", type: "uint256[]" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    type: "function", name: "stampCount", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function", name: "earned", stateMutability: "view",
    inputs: [{ name: "", type: "address" }, { name: "", type: "uint256" }, { name: "", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function", name: "totalMinted", stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function", name: "uri", stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

export const QUEST_ENGINE_ABI = [
  {
    type: "function", name: "completeQuest", stateMutability: "nonpayable",
    inputs: [
      { name: "questId", type: "uint256" },
      { name: "matchId", type: "uint256" },
      { name: "proof", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function", name: "completed", stateMutability: "view",
    inputs: [{ name: "", type: "address" }, { name: "", type: "uint256" }, { name: "", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function", name: "getUserProgress", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }, { name: "matchId", type: "uint256" }],
    outputs: [{ name: "status", type: "bool[5]" }],
  },
  {
    type: "function", name: "quests", stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "questId", type: "uint256" },
      { name: "points", type: "uint256" },
      { name: "requiresProof", type: "bool" },
      { name: "active", type: "bool" },
    ],
  },
  {
    type: "function", name: "trustedSigner", stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "event", name: "QuestCompleted",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "questId", type: "uint256", indexed: false },
      { name: "matchId", type: "uint256", indexed: false },
      { name: "teamId", type: "uint8", indexed: false },
      { name: "points", type: "uint256", indexed: false },
    ],
  },
  {
    type: "error", name: "NoPass", inputs: [],
  },
  {
    type: "error", name: "QuestInactive", inputs: [],
  },
  {
    type: "error", name: "AlreadyCompleted", inputs: [],
  },
  {
    type: "error", name: "InvalidProof", inputs: [],
  },
  {
    type: "error", name: "QuestNotFound", inputs: [],
  },
] as const;

export const FAN_WARS_ABI = [
  {
    type: "function", name: "teamScores", stateMutability: "view",
    inputs: [{ name: "", type: "uint8" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function", name: "fanScores", stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function", name: "getLeaderboard", stateMutability: "view",
    inputs: [],
    outputs: [{ name: "scores", type: "uint256[8]" }],
  },
  {
    type: "function", name: "getTopFans", stateMutability: "view",
    inputs: [{ name: "teamId", type: "uint8" }, { name: "count", type: "uint256" }],
    outputs: [{ name: "topFans", type: "address[]" }, { name: "topScores", type: "uint256[]" }],
  },
  {
    type: "function", name: "teamFanCount", stateMutability: "view",
    inputs: [{ name: "teamId", type: "uint8" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const QUEST_IDS = {
  TEAM_PASS: 1,
  TOSS_PREDICT: 2,
  MATCH_CHECKIN: 3,
  FAN_VOTE: 4,
  REFERRAL: 5,
} as const;

export const TEAM_CHANGE_COOLDOWN = 90 * 24 * 60 * 60; // 90 days in seconds
