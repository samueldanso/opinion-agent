"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonologueProps {
  lines: string[];
}

export function Monologue({ lines }: MonologueProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Agent Monologue</span>
          <span className="animate-blink text-[var(--terminal-text)]">_</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div
          ref={scrollRef}
          className="min-h-64 max-h-[520px] overflow-y-auto rounded-lg p-3 font-mono text-xs leading-relaxed"
          style={{ background: "var(--terminal-bg)", color: "var(--terminal-text)" }}
        >
          {lines.length === 0 ? (
            <p className="text-muted-foreground italic">Waiting for agent thoughts...</p>
          ) : (
            lines.map((line, i) => (
              <p key={i} className="py-0.5">
                <span className="opacity-40 mr-2 select-none">{String(i + 1).padStart(3, "0")}</span>
                {line}
              </p>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
