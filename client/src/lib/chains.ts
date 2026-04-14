import { defineChain } from "viem";

export const wirefluidTestnet = defineChain({
  id: 92533,
  name: "WireFluid Testnet",
  nativeCurrency: {
    name: "WIRE",
    symbol: "WIRE",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL_WIREFLUID ?? "https://evm.wirefluid.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "WireScan",
      url: "https://wirefluidscan.com",
    },
  },
});
