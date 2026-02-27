"use client";

import dynamic from "next/dynamic";
import { useAgentStream } from "@/hooks/use-agent-stream";
import { ConnectButton } from "./connect-button";
import { BuySignal } from "./buy-signal";
import { Wallet } from "./wallet";
import { Survival } from "./survival";
import { Economics } from "./economics";
import { Monologue } from "./monologue";
import { Feed } from "./feed";

const TrackRecordChart = dynamic(
  () => import("./track-record-chart").then((m) => m.TrackRecordChart),
  { ssr: false },
);

const ParticleBg = dynamic(
  () => import("./particle-bg").then((m) => m.ParticleBg),
  { ssr: false },
);

function SigintMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-6" fill="none" role="img">
      <title>SIGINT</title>
      <circle cx="16" cy="16" r="3" fill="#DA1C1C" />
      {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => {
        const angle = (deg * Math.PI) / 180;
        const x1 = 16 + Math.cos(angle) * 6;
        const y1 = 16 + Math.sin(angle) * 6;
        const x2 = 16 + Math.cos(angle) * 13;
        const y2 = 16 + Math.sin(angle) * 13;
        const cx1 = 16 + Math.cos(angle + 0.3) * 9.5;
        const cy1 = 16 + Math.sin(angle + 0.3) * 9.5;
        return (
          <path
            key={deg}
            d={`M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2}`}
            stroke="#DA1C1C"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}

export function Dashboard() {
  const state = useAgentStream();

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] p-4 md:p-8">
      <ParticleBg />
      <header className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <SigintMark />
          <h1 className="font-mono text-lg font-bold tracking-[0.15em] text-[#DA1C1C]">
            SIGINT
          </h1>
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
