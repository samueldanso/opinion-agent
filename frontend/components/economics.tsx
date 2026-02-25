"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUSD } from "@/lib/utils";

interface EconomicsProps {
  earned: number;
  spent: number;
}

export function Economics({ earned, spent }: EconomicsProps) {
  const margin = earned - spent;
  const marginColor = margin >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]";
  const marginSign = margin >= 0 ? "+" : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Economics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row label="Earned" value={formatUSD(earned)} className="text-[var(--color-up)]" />
        <Row label="Spent" value={formatUSD(spent)} className="text-[var(--color-down)]" />
        <div className="border-t border-border pt-3">
          <Row label="Margin" value={`${marginSign}${formatUSD(margin)}`} className={marginColor} />
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-xs uppercase tracking-wider">{label}</span>
      <span className={`font-mono text-sm font-semibold ${className ?? ""}`}>{value}</span>
    </div>
  );
}
