"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SignalRow } from "@/lib/types";

interface TrackRecordChartProps {
  signals: SignalRow[];
}

export function TrackRecordChart({ signals }: TrackRecordChartProps) {
  const resolved = signals
    .filter((s) => s.correct !== null && s.resolvedPrice !== null)
    .sort((a, b) => a.formedAt - b.formedAt)
    .slice(-20)
    .map((s) => {
      const delta =
        ((s.resolvedPrice! - s.currentPrice) / s.currentPrice) * 100;
      return {
        id: s.id,
        dir: s.direction.toUpperCase(),
        correct: s.correct === 1,
        delta: parseFloat(delta.toFixed(2)),
        confidence: s.confidence,
      };
    });

  if (resolved.length === 0) {
    return (
      <Card className="card-glow bg-[#0d0d0d]">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm tracking-wider text-neutral-400">
            TRACK RECORD
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-600 font-mono text-xs italic">
            No resolved signals yet...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-glow bg-[#0d0d0d]">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-sm tracking-wider text-neutral-400">
          TRACK RECORD
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={resolved} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="id"
              tick={{ fill: "#404040", fontSize: 10, fontFamily: "monospace" }}
              axisLine={{ stroke: "#1a1a1a" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#404040", fontSize: 10, fontFamily: "monospace" }}
              axisLine={{ stroke: "#1a1a1a" }}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111",
                border: "1px solid #222",
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: "11px",
              }}
              formatter={(value: number | undefined) => {
                if (value === undefined) return ["-", ""];
                return [`${value > 0 ? "+" : ""}${value}%`, "delta"];
              }}
              labelFormatter={() => ""}
            />
            <Bar dataKey="delta" radius={[2, 2, 0, 0]}>
              {resolved.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={entry.correct ? "#22c55e" : "#ef4444"}
                  fillOpacity={0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
