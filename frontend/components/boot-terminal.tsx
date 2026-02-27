"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playKeystroke } from "@/lib/sounds";

const PARTICLE_COUNT = 50;

function BootParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: `bp-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.5 + 0.5,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#DA1C1C]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

interface BootTerminalProps {
  onComplete: () => void;
}

const BOOT_LINES = [
  "SIGINT — On-chain Signals Intelligence",
  "Connecting to Base mainnet...",
  "Sovereign agent: loading...",
  "Checking balance...",
  "Signal price: $0.10 USDC",
  "Loading dashboard...",
];

const LINE_DELAY = 600;
const CHAR_DELAY = 35;
const COMPLETE_DELAY = 800;

export function BootTerminal({ onComplete }: BootTerminalProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState("");
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [liveLines, setLiveLines] = useState<string[]>([]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchBootData() {
      try {
        const res = await fetch("/api/status");
        if (!res.ok) return;
        const data = await res.json();

        const dynamicLines = [
          "SIGINT — On-chain Signals Intelligence",
          "Connecting to Base mainnet...",
          `Sovereign agent: ${data.address ?? "0xA44F...04e5"}`,
          `Accuracy: ${data.accuracy?.toFixed(0) ?? 0}% (${data.correct ?? 0}/${data.total ?? 0})`,
          `Earn/spend ratio: ${data.ratio?.toFixed(2) ?? "0.00"} — ${data.tier?.toUpperCase() ?? "SURVIVING"}`,
          `Signal price: $${data.signalPrice?.toFixed(2) ?? "0.10"} USDC`,
          "Loading dashboard...",
        ];
        setLiveLines(dynamicLines);
      } catch {
        setLiveLines(BOOT_LINES);
      }
    }

    fetchBootData();
  }, []);

  const resolvedLines = liveLines.length > 0 ? liveLines : BOOT_LINES;

  useEffect(() => {
    if (lineIndex >= resolvedLines.length) {
      const timeout = setTimeout(onComplete, COMPLETE_DELAY);
      return () => clearTimeout(timeout);
    }

    if (!isTyping) {
      const timeout = setTimeout(() => setIsTyping(true), LINE_DELAY);
      return () => clearTimeout(timeout);
    }

    const line = resolvedLines[lineIndex];
    if (charIndex < line.length) {
      const timeout = setTimeout(() => {
        playKeystroke();
        setCurrentLine((prev) => prev + line[charIndex]);
        setCharIndex((prev) => prev + 1);
      }, CHAR_DELAY);
      return () => clearTimeout(timeout);
    }

    setLines((prev) => [...prev, currentLine]);
    setCurrentLine("");
    setCharIndex(0);
    setIsTyping(false);
    setLineIndex((prev) => prev + 1);
  }, [lineIndex, charIndex, isTyping, resolvedLines, currentLine, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#060606] p-6 md:p-12">
      <BootParticles />
      <button
        onClick={handleSkip}
        type="button"
        className="absolute right-4 top-4 font-mono text-[10px] text-neutral-600 transition-colors hover:text-neutral-400"
      >
        SKIP →
      </button>

      <div className="flex-1 font-mono text-base leading-loose text-[#DA1C1C]">
        <AnimatePresence>
          {lines.map((line, i) => (
            <motion.p
              key={`line-${i}-${line.slice(0, 10)}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-0.5"
            >
              <span className="mr-3 text-neutral-700 select-none">[BOOT]</span>
              {line}
            </motion.p>
          ))}
        </AnimatePresence>

        {currentLine && (
          <p className="py-0.5">
            <span className="mr-3 text-neutral-700 select-none">[BOOT]</span>
            {currentLine}
            <span className="animate-blink ml-0.5">_</span>
          </p>
        )}
      </div>
    </div>
  );
}
