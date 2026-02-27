"use client";

import { motion } from "framer-motion";
import { playClick } from "@/lib/sounds";

interface EntryGateProps {
  onEnter: () => void;
}

function SigintLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" role="img">
      <title>SIGINT logo</title>
      <circle cx="60" cy="60" r="54" stroke="#DA1C1C" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4" />
      <circle cx="60" cy="60" r="38" stroke="#DA1C1C" strokeWidth="0.8" strokeDasharray="3 5" opacity="0.25" />
      <circle cx="60" cy="60" r="22" stroke="#DA1C1C" strokeWidth="0.5" opacity="0.15" />

      <line x1="60" y1="6" x2="60" y2="30" stroke="#DA1C1C" strokeWidth="0.5" opacity="0.3" />
      <line x1="60" y1="90" x2="60" y2="114" stroke="#DA1C1C" strokeWidth="0.5" opacity="0.3" />
      <line x1="6" y1="60" x2="30" y2="60" stroke="#DA1C1C" strokeWidth="0.5" opacity="0.3" />
      <line x1="90" y1="60" x2="114" y2="60" stroke="#DA1C1C" strokeWidth="0.5" opacity="0.3" />

      <line x1="20" y1="20" x2="36" y2="36" stroke="#DA1C1C" strokeWidth="0.4" opacity="0.2" />
      <line x1="84" y1="84" x2="100" y2="100" stroke="#DA1C1C" strokeWidth="0.4" opacity="0.2" />
      <line x1="100" y1="20" x2="84" y2="36" stroke="#DA1C1C" strokeWidth="0.4" opacity="0.2" />
      <line x1="36" y1="84" x2="20" y2="100" stroke="#DA1C1C" strokeWidth="0.4" opacity="0.2" />

      <circle cx="60" cy="60" r="5" fill="#DA1C1C" opacity="0.9" />
      <circle cx="60" cy="60" r="8" fill="none" stroke="#DA1C1C" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

function GateParticles() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
  }));

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
          animate={{ opacity: [0, 0.4, 0] }}
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

export function EntryGate({ onEnter }: EntryGateProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#060606]">
      <GateParticles />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-8"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <SigintLogo className="size-28" />
        </motion.div>

        <div className="text-center">
          <h1 className="font-mono text-2xl font-bold tracking-[0.3em] text-[#DA1C1C]">
            SIGINT
          </h1>
          <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-neutral-600">
            ON-CHAIN SIGNALS INTELLIGENCE
          </p>
        </div>

        <p className="max-w-xs text-center font-mono text-[11px] leading-relaxed text-neutral-500">
          A sovereign AI agent that forms ETH price signals,
          backs every call with its own capital, and sells
          conviction via x402 micropayments.
        </p>

        <motion.button
          onClick={() => { playClick(); onEnter(); }}
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(218, 28, 28, 0.3)" }}
          whileTap={{ scale: 0.95 }}
          className="rounded-full border border-[#DA1C1C]/30 bg-[#DA1C1C] px-10 py-3 font-mono text-sm font-semibold tracking-wider text-white transition-colors hover:bg-[#B91C1B]"
        >
          ENTER
        </motion.button>

        <div className="flex items-center gap-4 font-mono text-[9px] text-neutral-700">
          <span>LIVE ON BASE</span>
          <span className="text-neutral-800">|</span>
          <span>POWERED BY PINIONOS</span>
          <span className="text-neutral-800">|</span>
          <span>x402 PROTOCOL</span>
        </div>
      </motion.div>
    </div>
  );
}
