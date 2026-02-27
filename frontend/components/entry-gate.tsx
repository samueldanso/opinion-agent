"use client";

import { motion } from "framer-motion";
import { playClick } from "@/lib/sounds";

interface EntryGateProps {
  onEnter: () => void;
}

export function EntryGate({ onEnter }: EntryGateProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center gap-10"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="relative size-24"
        >
          <svg viewBox="0 0 100 100" className="size-full">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#FF6B35"
              strokeWidth="1"
              strokeDasharray="4 8"
              opacity="0.6"
            />
            <circle
              cx="50"
              cy="50"
              r="30"
              fill="none"
              stroke="#FF6B35"
              strokeWidth="0.5"
              strokeDasharray="2 6"
              opacity="0.3"
            />
            <circle cx="50" cy="50" r="4" fill="#FF6B35" />
          </svg>
        </motion.div>

        <div className="text-center">
          <h1 className="font-mono text-2xl font-bold tracking-[0.3em] text-[#FF6B35]">
            SIGINT
          </h1>
          <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-neutral-600">
            ON-CHAIN SIGNALS INTELLIGENCE
          </p>
        </div>

        <motion.button
          onClick={() => { playClick(); onEnter(); }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-full bg-[#FF6B35] px-10 py-3 font-mono text-sm font-semibold tracking-wider text-black transition-colors hover:bg-[#FF8555]"
        >
          ENTER
        </motion.button>
      </motion.div>

      <p className="absolute bottom-6 font-mono text-[10px] text-neutral-700">
        Built on PinionOS — Live on Base
      </p>
    </div>
  );
}
