"use client";

import { useAgentStream } from "@/hooks/use-agent-stream";
import { Wallet } from "./wallet";
import { Survival } from "./survival";
import { Economics } from "./economics";
import { Monologue } from "./monologue";
import { Feed } from "./feed";

export function Dashboard() {
  const state = useAgentStream();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">OPINION</h1>
          <p className="text-sm text-muted-foreground">The first self-funding AI prediction agent</p>
        </div>
        <div className="flex items-center gap-3">
          {state.price !== null && (
            <span className="font-mono text-sm">
              ETH: ${state.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
          <span className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className={`size-2 rounded-full ${state.connected ? "bg-emerald-400" : "bg-red-400"}`} />
            {state.connected ? "Live" : "Reconnecting..."}
          </span>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-[1fr_1.5fr]">
        <div className="flex flex-col gap-4">
          <Wallet
            usdc={state.usdc}
            tier={state.tier}
            price={state.price}
            connected={state.connected}
          />
          <Survival
            ratio={state.ratio}
            runway={state.runway}
            tier={state.tier}
            accuracy={state.accuracy}
            totalPredictions={state.totalPredictions}
            correctCount={state.correctCount}
            unlimitedKey={state.unlimitedKey}
          />
          <Economics earned={state.earned} spent={state.spent} />
        </div>

        <Monologue lines={state.monologue} />
      </div>

      <div className="mt-4">
        <Feed predictions={state.predictions} />
      </div>
    </div>
  );
}
