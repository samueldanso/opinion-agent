"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SignalRow, TradeRow } from "@/lib/types";
import { formatRelativeTime, formatUSD } from "@/lib/utils";

interface FeedProps {
  signals: SignalRow[];
  trades: TradeRow[];
}

export function Feed({ signals, trades }: FeedProps) {
  const sorted = [...signals].sort((a, b) => b.formedAt - a.formedAt);
  const tradeMap = new Map(trades.map((t) => [t.signalId, t]));

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Signal Log</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="h-80 overflow-y-auto space-y-2">
          {sorted.length === 0 ? (
            <p className="text-muted-foreground text-sm italic">No signals yet...</p>
          ) : (
            sorted.map((s) => (
              <SignalItem key={s.id} signal={s} trade={tradeMap.get(s.id)} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SignalItem({ signal: s, trade }: { signal: SignalRow; trade?: TradeRow }) {
  const isPending = s.correct === null;
  const isCorrect = s.correct === 1;

  const statusIcon = isPending ? "\u23f3" : isCorrect ? "\u2705" : "\u274c";
  const directionColor =
    s.direction === "up" ? "text-[var(--color-up)]" : "text-[var(--color-down)]";
  const arrow = s.direction === "up" ? "\u2191" : "\u2193";

  const pnlText =
    trade?.resolvedPnl != null
      ? `${trade.resolvedPnl >= 0 ? "+" : ""}${formatUSD(trade.resolvedPnl)}`
      : trade
        ? "pending"
        : "";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2">
      <span className="text-lg">{statusIcon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-mono font-bold ${directionColor}`}>
            {arrow} {s.direction.toUpperCase()}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5">
            {s.confidence}%
          </Badge>
          {s.resolvedPrice !== null && (
            <span className="text-xs text-muted-foreground font-mono">
              ${s.currentPrice.toFixed(0)} → ${s.resolvedPrice.toFixed(0)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{s.reasoning}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono text-xs">{formatUSD(s.currentPrice)}</p>
        {pnlText && (
          <p
            className={`text-[10px] font-mono ${trade?.resolvedPnl != null && trade.resolvedPnl >= 0 ? "text-[var(--color-up)]" : trade?.resolvedPnl != null ? "text-[var(--color-down)]" : "text-muted-foreground"}`}
          >
            trade {pnlText}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground">{formatRelativeTime(s.formedAt)}</p>
      </div>
    </div>
  );
}
