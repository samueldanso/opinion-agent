"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { formatUSD } from "@/lib/utils";
import type { SignalRow } from "@/lib/types";

const AGENT_SIGNAL_URL =
  process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:4020";

interface BuySignalProps {
  signalPrice: number;
  onSignalReceived?: () => void;
}

interface SignalResponse {
  direction: "up" | "down";
  confidence: number;
  currentPrice: number;
  resolveAt: number;
  reasoning: string;
  tradeHash: string;
  onchainContext: {
    fundingRate: number;
    liquidationBias: string;
    dexCexVolumeRatio: number;
  };
  trackRecord: {
    correct: number;
    total: number;
    last5: Array<{ direction: string; correct: boolean; timestamp: number }>;
    tradePnl: number;
  };
}

export function BuySignal({ signalPrice, onSignalReceived }: BuySignalProps) {
  const { isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [lastSignal, setLastSignal] = useState<SignalResponse | null>(null);

  async function handleBuy() {
    setLoading(true);
    try {
      toast.info("Requesting signal from SIGINT agent...");

      const res = await fetch(`${AGENT_SIGNAL_URL}/signal/eth`);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const signal: SignalResponse = await res.json();
      setLastSignal(signal);
      onSignalReceived?.();

      toast.success(
        `Signal received: ${signal.direction.toUpperCase()} (${signal.confidence}%)`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buy Signal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider">
              Signal Price
            </p>
            <p className="font-mono text-2xl font-bold">{formatUSD(signalPrice)}</p>
            <p className="text-[10px] text-muted-foreground">USDC on Base</p>
          </div>
          <Button
            onClick={handleBuy}
            disabled={loading}
            size="lg"
            className="font-mono"
          >
            {loading ? "Requesting..." : `Buy Signal`}
          </Button>
        </div>

        {lastSignal && (
          <div className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`font-mono font-bold text-lg ${lastSignal.direction === "up" ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}
              >
                {lastSignal.direction === "up" ? "\u2191" : "\u2193"}{" "}
                {lastSignal.direction.toUpperCase()}
              </span>
              <span className="text-sm text-muted-foreground">
                {lastSignal.confidence}% confidence
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{lastSignal.reasoning}</p>
            <div className="flex gap-4 text-[10px] font-mono text-muted-foreground">
              <span>
                Trade:{" "}
                <a
                  href={`https://basescan.org/tx/${lastSignal.tradeHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {lastSignal.tradeHash.slice(0, 10)}...
                </a>
              </span>
              <span>FR: {lastSignal.onchainContext.fundingRate.toFixed(4)}%</span>
              <span>DEX/CEX: {lastSignal.onchainContext.dexCexVolumeRatio.toFixed(2)}</span>
            </div>
          </div>
        )}

        {!isConnected && (
          <p className="text-xs text-muted-foreground text-center">
            Connect wallet for on-chain payment via x402
          </p>
        )}
      </CardContent>
    </Card>
  );
}
