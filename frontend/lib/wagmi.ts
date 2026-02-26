import { http, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "placeholder",
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});
