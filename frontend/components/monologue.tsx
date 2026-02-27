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
    <Card className="flex flex-col h-full bg-[#0d0d0d] border-white/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-mono text-sm tracking-wider text-neutral-400">
          <span>AGENT MONOLOGUE</span>
          <span className="animate-blink text-[#FF6B35]">_</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div
          ref={scrollRef}
          className="min-h-64 max-h-[520px] overflow-y-auto rounded p-3 font-mono text-xs leading-relaxed"
          style={{ background: "var(--terminal-bg)", color: "var(--terminal-text)" }}
        >
          {lines.length === 0 ? (
            <p className="text-neutral-600 italic">Waiting for agent thoughts...</p>
          ) : (
            lines.map((line, i) => (
              <p key={`${i}-${line.slice(0, 20)}`} className="py-0.5">
                <span className="opacity-30 mr-2 select-none text-neutral-600">
                  {String(i + 1).padStart(3, "0")}
                </span>
                {line}
              </p>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
