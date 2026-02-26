import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { SpendTier } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function formatUSD(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function deriveTier(ratio: number, earned = 0): SpendTier {
  if (earned >= 50) return "Flush";
  if (ratio < 0.5) return "Starving";
  if (ratio < 1.0) return "Surviving";
  if (ratio < 1.5) return "Breaking Even";
  return "Thriving";
}
