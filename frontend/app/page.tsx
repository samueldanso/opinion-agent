"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { EntryGate } from "@/components/entry-gate";

const BootTerminal = dynamic(
  () => import("@/components/boot-terminal").then((m) => m.BootTerminal),
  { ssr: false },
);

const Dashboard = dynamic(
  () => import("@/components/dashboard").then((m) => m.Dashboard),
  { ssr: false },
);

const STORAGE_KEY = "sigint-booted";

type Screen = "loading" | "gate" | "boot" | "dashboard";

export default function Page() {
  const [screen, setScreen] = useState<Screen>("loading");

  useEffect(() => {
    const booted = localStorage.getItem(STORAGE_KEY);
    setScreen(booted ? "dashboard" : "gate");
  }, []);

  const handleEnter = useCallback(() => {
    const booted = localStorage.getItem(STORAGE_KEY);
    setScreen(booted ? "dashboard" : "boot");
  }, []);

  const handleBootComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    setScreen("dashboard");
  }, []);

  const handleLogoClick = useCallback(() => {
    setScreen("gate");
  }, []);

  if (screen === "loading") {
    return <div className="fixed inset-0 bg-[#060606]" />;
  }

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
          <Dashboard onLogoClick={handleLogoClick} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
