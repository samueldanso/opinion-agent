"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SpendTier } from "@/lib/types";

interface SurvivalProps {
  ratio: number | null;
  runway: number | null;
  tier: SpendTier;
  accuracy: number;
  totalPredictions: number;
  correctCount: number;
  unlimitedKey: string | null;
}

export function Survival({
  ratio,
  runway,
  tier,
  accuracy,
  totalPredictions,
  correctCount,
  unlimitedKey,
}: SurvivalProps) {
  const ratioDisplay = ratio !== null ? ratio.toFixed(2) : "—";
  const runwayDisplay = runway !== null ? `${runway.toFixed(1)}d` : "—";
  const accuracyPct = (accuracy * 100).toFixed(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Survival Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Earn/Spend" value={`${ratioDisplay}x`} />
          <Stat label="Runway" value={runwayDisplay} />
          <Stat label="Status" value={tier} />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Track Record</span>
            <span className="font-mono">
              {accuracyPct}% ({correctCount}/{totalPredictions})
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${accuracy * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">$100 Unlimited</span>
            <span className="font-mono">
              {unlimitedKey ? "UNLOCKED" : "In progress"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${unlimitedKey ? "bg-violet-500" : "bg-violet-500/60"}`}
              style={{ width: unlimitedKey ? "100%" : "0%" }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-muted-foreground text-xs uppercase tracking-wider">{label}</p>
      <p className="font-mono text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}
