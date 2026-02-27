"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SignalRow, TradeRow } from "@/lib/types";
import { formatRelativeTime, formatUSD } from "@/lib/utils";

interface FeedProps {
  signals: SignalRow[];
  trades: TradeRow[];
}

function calculateDelta(currentPrice: number, resolvedPrice: number): string {
  const delta = ((resolvedPrice - currentPrice) / currentPrice) * 100;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

export function Feed({ signals, trades }: FeedProps) {
  const sorted = [...signals].sort((a, b) => b.formedAt - a.formedAt);
  const tradeMap = new Map(trades.map((t) => [t.signalId, t]));

  return (
    <Card className="flex flex-col h-full bg-[#0d0d0d] border-white/5">
      <CardHeader>
        <CardTitle className="font-mono text-sm tracking-wider text-neutral-400">
          SIGNAL LOG
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="max-h-80 overflow-y-auto space-y-1.5">
          {sorted.length === 0 ? (
            <p className="text-neutral-600 text-sm italic font-mono">
              No signals yet...
            </p>
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

  const dir = s.direction.toUpperCase();
  const mark = isPending ? "" : isCorrect ? "✓" : "✗";
  const delta =
    !isPending && s.resolvedPrice !== null
      ? calculateDelta(s.currentPrice, s.resolvedPrice)
      : null;

  const dirColor =
    s.direction === "up" ? "text-[var(--color-up)]" : "text-[var(--color-down)]";
  const statusColor = isPending
    ? "text-[var(--color-pending)]"
    : isCorrect
      ? "text-[var(--color-up)]"
      : "text-[var(--color-down)]";

  return (
    <div className="flex items-center gap-3 rounded border border-white/5 bg-white/[0.02] px-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-mono font-bold text-sm ${dirColor}`}>
            {dir}
          </span>
          {mark && (
            <span className={`font-mono text-sm ${statusColor}`}>{mark}</span>
          )}
          {delta && (
            <span className={`font-mono text-xs ${statusColor}`}>{delta}</span>
          )}
          <Badge variant="outline" className="text-[10px] px-1.5 border-white/10">
            {s.confidence}%
          </Badge>
          {isPending && (
            <span className="text-[10px] text-[var(--color-pending)] font-mono">
              pending
            </span>
          )}
        </div>
        <p className="text-[11px] text-neutral-500 truncate mt-0.5 font-mono">
          {s.reasoning}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono text-xs text-neutral-400">{formatUSD(s.currentPrice)}</p>
        {trade?.txHash && (
          <a
            href={`https://basescan.org/tx/${trade.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono text-neutral-600 hover:text-[#DA1C1C] transition-colors"
          >
            {trade.txHash.slice(0, 8)}...
          </a>
        )}
        <p className="text-[10px] text-neutral-600 font-mono">
          {formatRelativeTime(s.formedAt)}
        </p>
      </div>
    </div>
  );
}
