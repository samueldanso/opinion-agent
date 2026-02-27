"use client";

import { useState } from "react";
import { useAccount, useSignTypedData, useSwitchChain } from "wagmi";
import { base } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { formatUSD } from "@/lib/utils";

const AGENT_SIGNAL_URL =
  process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:4020";

interface BuySignalProps {
  signalPrice: number;
  onSignalReceived?: () => void;
}

interface PaymentRequirements {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  payTo: string;
  asset: string;
  maxTimeoutSeconds: number;
  extra?: { name?: string; version?: string };
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
  const { isConnected, address, chainId } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChainAsync } = useSwitchChain();
  const [loading, setLoading] = useState(false);
  const [lastSignal, setLastSignal] = useState<SignalResponse | null>(null);

  const isWrongChain = isConnected && chainId !== base.id;

  async function handleBuy() {
    if (!isConnected || !address) {
      toast.error("Connect your wallet first");
      return;
    }

    if (isWrongChain) {
      try {
        await switchChainAsync({ chainId: base.id });
      } catch {
        toast.error("Switch to Base mainnet to buy signals");
        return;
      }
    }

    setLoading(true);
    try {
      toast.info("Contacting SIGINT agent...");

      // 1. Initial request — expect 402
      const initial = await fetch(`${AGENT_SIGNAL_URL}/signal/eth`, {
        headers: { Accept: "application/json" },
      });

      if (initial.status !== 402) {
        if (!initial.ok) {
          const text = await initial.text();
          throw new Error(text || `HTTP ${initial.status}`);
        }
        const signal: SignalResponse = await initial.json();
        setLastSignal(signal);
        onSignalReceived?.();
        toast.success(`Signal: ${signal.direction.toUpperCase()} (${signal.confidence}%)`);
        return;
      }

      // 2. Parse payment requirements from 402 body
      const body = await initial.json();
      const req: PaymentRequirements = body.accepts?.[0];
      if (!req) throw new Error("Invalid payment requirements from agent");

      toast.info(`Signing $${(Number(req.maxAmountRequired) / 1e6).toFixed(2)} USDC payment...`);

      // 3. Build EIP-712 TransferWithAuthorization
      const nonce = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}` as `0x${string}`;
      const nowSec = Math.floor(Date.now() / 1000);
      const validAfter = BigInt(nowSec - 600);
      const validBefore = BigInt(nowSec + (req.maxTimeoutSeconds || 900));

      const signature = await signTypedDataAsync({
        domain: {
          name: req.extra?.name ?? "USD Coin",
          version: req.extra?.version ?? "2",
          chainId: base.id,
          verifyingContract: req.asset as `0x${string}`,
        },
        types: {
          TransferWithAuthorization: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "validAfter", type: "uint256" },
            { name: "validBefore", type: "uint256" },
            { name: "nonce", type: "bytes32" },
          ],
        },
        primaryType: "TransferWithAuthorization",
        message: {
          from: address,
          to: req.payTo as `0x${string}`,
          value: BigInt(req.maxAmountRequired),
          validAfter,
          validBefore,
          nonce,
        },
      });

      // 4. Encode payment header
      const paymentPayload = {
        x402Version: body.x402Version ?? 1,
        scheme: req.scheme,
        network: req.network,
        payload: {
          signature,
          authorization: {
            from: address,
            to: req.payTo,
            value: req.maxAmountRequired,
            validAfter: validAfter.toString(),
            validBefore: validBefore.toString(),
            nonce,
          },
        },
      };
      const paymentHeader = btoa(JSON.stringify(paymentPayload));

      toast.info("Payment signed. Fetching signal...");

      // 5. Retry with payment
      const paid = await fetch(`${AGENT_SIGNAL_URL}/signal/eth`, {
        headers: {
          Accept: "application/json",
          "X-PAYMENT": paymentHeader,
        },
      });

      if (!paid.ok) {
        const errText = await paid.text();
        throw new Error(errText || `Payment failed: HTTP ${paid.status}`);
      }

      const signal: SignalResponse = await paid.json();
      setLastSignal(signal);
      onSignalReceived?.();
      toast.success(`Signal: ${signal.direction.toUpperCase()} (${signal.confidence}%)`);
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
            {loading
              ? "Processing..."
              : isWrongChain
                ? "Switch to Base"
                : "Buy Signal"}
          </Button>
        </div>

        {!isConnected && (
          <p className="text-xs text-muted-foreground text-center">
            Connect wallet (Base) to buy with x402
          </p>
        )}

        {lastSignal && (
          <div className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`font-mono font-bold text-lg ${
                  lastSignal.direction === "up"
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {lastSignal.direction === "up" ? "↑" : "↓"}{" "}
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
              <span>
                DEX/CEX: {lastSignal.onchainContext.dexCexVolumeRatio.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
