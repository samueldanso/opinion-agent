"use client";

import { useAgentStream } from "@/hooks/use-agent-stream";
import { ConnectButton } from "./connect-button";
import { BuySignal } from "./buy-signal";
import { Wallet } from "./wallet";
import { Survival } from "./survival";
import { Economics } from "./economics";
import { Monologue } from "./monologue";
import { Feed } from "./feed";
import { TrackRecordChart } from "./track-record-chart";
import { ParticleBg } from "./particle-bg";

export function Dashboard() {
  const state = useAgentStream();

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] p-4 md:p-8">
      <ParticleBg />
      <header className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="size-2 rounded-full bg-[#FF6B35] animate-pulse" />
          <h1 className="font-mono text-lg font-bold tracking-[0.15em] text-[#FF6B35]">
            SIGINT
          </h1>
          <span className="font-mono text-[10px] text-neutral-600">v3</span>
        </div>
        <div className="flex items-center gap-4">
          {state.price !== null && (
            <span className="font-mono text-sm text-neutral-400">
              ETH ${state.price.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          )}
          <span className="flex items-center gap-2 font-mono text-[10px] text-neutral-500">
            <span
              className={`size-1.5 rounded-full ${state.connected ? "bg-emerald-500" : "bg-red-500"}`}
            />
            {state.connected ? "LIVE" : "RECONNECTING"}
          </span>
          <ConnectButton />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.8fr]">
        <div className="flex flex-col gap-4">
          <Wallet
            usdc={state.usdc}
            tier={state.tier}
            price={state.price}
            signalPrice={state.signalPrice}
            connected={state.connected}
          />
          <BuySignal
            signalPrice={state.signalPrice}
            onSignalReceived={state.refetch}
          />
          <Survival
            ratio={state.ratio}
            runway={state.runway}
            tier={state.tier}
            accuracy={state.accuracy}
            totalSignals={state.totalSignals}
            correctCount={state.correctCount}
            unlimitedProgress={state.unlimitedProgress}
            unlimitedKey={state.unlimitedKey}
          />
          <Economics
            earned={state.earned}
            spent={state.spent}
            tradePnl={state.tradePnl}
          />
        </div>

        <div className="flex flex-col gap-4">
          <Monologue lines={state.monologue} />
          <TrackRecordChart signals={state.signals} />
          <Feed signals={state.signals} trades={state.trades} />
        </div>
      </div>
    </div>
  );
}
