"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EntryGate } from "@/components/entry-gate";
import { BootTerminal } from "@/components/boot-terminal";
import { Dashboard } from "@/components/dashboard";

type Screen = "gate" | "boot" | "dashboard";

export default function Page() {
  const [screen, setScreen] = useState<Screen>("gate");

  const handleEnter = useCallback(() => setScreen("boot"), []);
  const handleBootComplete = useCallback(() => setScreen("dashboard"), []);

  return (
    <AnimatePresence mode="wait">
      {screen === "gate" && (
        <motion.div
          key="gate"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <EntryGate onEnter={handleEnter} />
        </motion.div>
      )}

      {screen === "boot" && (
        <motion.div
          key="boot"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <BootTerminal onComplete={handleBootComplete} />
        </motion.div>
      )}

      {screen === "dashboard" && (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Dashboard />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
