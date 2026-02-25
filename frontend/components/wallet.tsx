"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SpendTier } from "@/lib/types";
import { formatUSD } from "@/lib/utils";

const TIER_CONFIG: Record<SpendTier, { color: string; label: string }> = {
  Starving: { color: "bg-red-500/20 text-red-400", label: "STARVING" },
  Surviving: { color: "bg-yellow-500/20 text-yellow-400", label: "SURVIVING" },
  "Breaking Even": { color: "bg-blue-500/20 text-blue-400", label: "BREAKING EVEN" },
  Thriving: { color: "bg-emerald-500/20 text-emerald-400", label: "THRIVING" },
};

interface WalletProps {
  usdc: number | null;
  tier: SpendTier;
  price: number | null;
  connected: boolean;
}

export function Wallet({ usdc, tier, price, connected }: WalletProps) {
  const tierInfo = TIER_CONFIG[tier];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Agent Wallet</span>
          <span className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}
            />
            <span className="text-xs text-muted-foreground">
              {connected ? "Live" : "Offline"}
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider">USDC Balance</p>
          <p className="text-3xl font-mono font-bold tracking-tight">
            {usdc !== null ? formatUSD(usdc) : "—"}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider">ETH Price</p>
            <p className="font-mono text-lg">
              {price !== null ? formatUSD(price) : "—"}
            </p>
          </div>
          <Badge className={tierInfo.color}>{tierInfo.label}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
