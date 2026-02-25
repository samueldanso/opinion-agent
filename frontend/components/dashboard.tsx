"use client";

import { useAgentStream } from "@/hooks/use-agent-stream";
import { Wallet } from "./wallet";
import { Survival } from "./survival";
import { Monologue } from "./monologue";
import { Feed } from "./feed";

export function Dashboard() {
  const state = useAgentStream();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">OPINION</h1>
          <p className="text-sm text-muted-foreground">Self-funding AI prediction agent</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className={`size-2 rounded-full ${state.connected ? "bg-emerald-400" : "bg-red-400"}`} />
          {state.connected ? "Connected" : "Reconnecting..."}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
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
        <Monologue lines={state.monologue} />
        <Feed predictions={state.predictions} />
      </div>
    </div>
  );
}
