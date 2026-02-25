"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PredictionRow } from "@/lib/types";
import { formatRelativeTime, formatUSD } from "@/lib/utils";

interface FeedProps {
  predictions: PredictionRow[];
}

export function Feed({ predictions }: FeedProps) {
  const sorted = [...predictions].sort((a, b) => b.predictedAt - a.predictedAt);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Prediction Feed</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="h-80 overflow-y-auto space-y-2">
          {sorted.length === 0 ? (
            <p className="text-muted-foreground text-sm italic">No predictions yet...</p>
          ) : (
            sorted.map((p) => <PredictionItem key={p.id} prediction={p} />)
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PredictionItem({ prediction: p }: { prediction: PredictionRow }) {
  const isPending = p.correct === null;
  const isCorrect = p.correct === 1;

  const statusIcon = isPending ? "\u23f3" : isCorrect ? "\u2705" : "\u274c";
  const directionColor = p.direction === "up" ? "text-[var(--color-up)]" : "text-[var(--color-down)]";
  const arrow = p.direction === "up" ? "\u2191" : "\u2193";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2">
      <span className="text-lg">{statusIcon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-mono font-bold ${directionColor}`}>
            {arrow} {p.direction.toUpperCase()}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5">
            {p.confidence}%
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{p.reasoning}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono text-xs">{formatUSD(p.currentPrice)}</p>
        <p className="text-[10px] text-muted-foreground">{formatRelativeTime(p.predictedAt)}</p>
      </div>
    </div>
  );
}
