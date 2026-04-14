import { http, createConfig } from "wagmi";
import { wirefluidTestnet } from "./chains";

export const config = createConfig({
  chains: [wirefluidTestnet],
  transports: {
    [wirefluidTestnet.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
