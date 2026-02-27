"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-neutral-400">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="font-mono text-[10px] border-[#DA1C1C]/30 text-[#DA1C1C] hover:bg-[#DA1C1C]/10 hover:text-[#DA1C1C]"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      onClick={() => connect({ connector: connectors[0] })}
      className="font-mono text-xs bg-[#DA1C1C] text-white hover:bg-[#B91C1B]"
    >
      Connect Wallet
    </Button>
  );
}
