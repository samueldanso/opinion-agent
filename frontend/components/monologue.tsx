"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonologueProps {
  lines: string[];
}

export function Monologue({ lines }: MonologueProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [renderedCount, setRenderedCount] = useState(0);

  useEffect(() => {
    if (lines.length > renderedCount) {
      setRenderedCount(lines.length);
    }
  }, [lines.length, renderedCount]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [renderedCount]);

  return (
    <Card className="flex flex-col h-full bg-[#0d0d0d] border-white/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-mono text-sm tracking-wider text-neutral-400">
          <span>AGENT MONOLOGUE</span>
          <span className="animate-blink text-[#DA1C1C]">_</span>
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
              <MonologueLine
                key={`${i}-${line.slice(0, 20)}`}
                line={line}
                index={i}
                isNew={i >= renderedCount - 3}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MonologueLine({ line, index, isNew }: { line: string; index: number; isNew: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!isNew || !ref.current) return;

    const el = ref.current;
    const textSpan = el.querySelector("[data-text]") as HTMLSpanElement | null;
    if (!textSpan) return;

    const fullText = textSpan.textContent ?? "";
    textSpan.textContent = "";

    const chars = fullText.split("");
    const fragment = document.createDocumentFragment();
    const charEls: HTMLSpanElement[] = [];

    for (const char of chars) {
      const span = document.createElement("span");
      span.textContent = char;
      span.style.opacity = "0";
      charEls.push(span);
      fragment.appendChild(span);
    }

    textSpan.textContent = "";
    textSpan.appendChild(fragment);

    gsap.to(charEls, {
      opacity: 1,
      duration: 0.02,
      stagger: 0.008,
      ease: "none",
    });
  }, [isNew]);

  return (
    <p ref={ref} className="py-0.5" style={{ opacity: isNew ? 1 : 0.7 }}>
      <span className="opacity-30 mr-2 select-none text-neutral-600">
        {String(index + 1).padStart(3, "0")}
      </span>
      <span data-text>{line}</span>
    </p>
  );
}
