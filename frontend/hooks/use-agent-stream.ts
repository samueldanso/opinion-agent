"use client";

import { useEffect, useReducer, useRef, useCallback } from "react";
import type { AgentState, SSEEvent, StatusResponse } from "@/lib/types";
import { deriveTier } from "@/lib/utils";

const MAX_MONOLOGUE = 200;

const initialState: AgentState = {
  connected: false,
  price: null,
  usdc: null,
  runway: null,
  ratio: null,
  earned: 0,
  spent: 0,
  tier: "Starving",
  accuracy: 0,
  totalSignals: 0,
  correctCount: 0,
  tradePnl: 0,
  signalPrice: 0.1,
  unlimitedProgress: 0,
  signals: [],
  trades: [],
  monologue: [],
  unlimitedKey: null,
};

type Action =
  | { type: "CONNECTED" }
  | { type: "DISCONNECTED" }
  | { type: "HYDRATE_STATUS"; payload: StatusResponse }
  | { type: "HYDRATE_SIGNALS"; payload: { signals: AgentState["signals"]; trades: AgentState["trades"] } }
  | { type: "SSE"; payload: SSEEvent };

function reducer(state: AgentState, action: Action): AgentState {
  switch (action.type) {
    case "CONNECTED":
      return { ...state, connected: true };
    case "DISCONNECTED":
      return { ...state, connected: false };
    case "HYDRATE_STATUS": {
      const s = action.payload;
      return {
        ...state,
        accuracy: s.accuracy,
        totalSignals: s.total,
        correctCount: s.correct,
        earned: s.totalEarned,
        tradePnl: s.tradePnl,
        ratio: s.ratio,
        tier: s.tier,
        signalPrice: s.signalPrice,
        unlimitedProgress: s.unlimitedProgress,
      };
    }
    case "HYDRATE_SIGNALS":
      return { ...state, signals: action.payload.signals, trades: action.payload.trades };
    case "SSE": {
      const event = action.payload;
      switch (event.type) {
        case "price_update":
          return { ...state, price: event.price };
        case "signal_sold":
          return {
            ...state,
            earned: state.earned + event.revenue,
            signalPrice: event.price,
          };
        case "trade_executed":
          return {
            ...state,
            monologue: [
              ...state.monologue,
              `Trade: ${event.direction.toUpperCase()} $${event.amountUSDC} → ${event.txHash.slice(0, 10)}...`,
            ].slice(-MAX_MONOLOGUE),
          };
        case "trade_verified":
          return state;
        case "signal_resolved":
          return {
            ...state,
            accuracy: event.accuracy,
            tradePnl: state.tradePnl + event.pnl,
            correctCount: event.correct ? state.correctCount + 1 : state.correctCount,
            totalSignals: state.totalSignals + 1,
          };
        case "balance_update":
          return {
            ...state,
            usdc: event.usdc,
            runway: event.runway,
            ratio: event.ratio,
            earned: event.earned,
            spent: event.spent,
            tier: deriveTier(event.ratio, event.earned),
          };
        case "price_adjusted":
          return {
            ...state,
            signalPrice: event.newPrice,
            monologue: [
              ...state.monologue,
              `Signal price: $${event.oldPrice.toFixed(2)} → $${event.newPrice.toFixed(2)} (${event.reason})`,
            ].slice(-MAX_MONOLOGUE),
          };
        case "reinvestment":
          return state;
        case "milestone":
          return {
            ...state,
            monologue: [
              ...state.monologue,
              `MILESTONE: ${event.event} — tx: ${event.txHash.slice(0, 10)}...`,
            ].slice(-MAX_MONOLOGUE),
          };
        case "monologue":
          return {
            ...state,
            monologue: [...state.monologue, event.text].slice(-MAX_MONOLOGUE),
          };
        case "unlimited_purchased":
          return { ...state, unlimitedKey: event.apiKey, unlimitedProgress: 100 };
        default:
          return state;
      }
    }
    default:
      return state;
  }
}

export function useAgentStream(): AgentState & { refetch: () => void } {
  const [state, dispatch] = useReducer(reducer, initialState);
  const retryRef = useRef(0);
  const esRef = useRef<EventSource | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const [statusRes, signalsRes] = await Promise.all([
        fetch("/api/status"),
        fetch("/api/signals"),
      ]);
      if (statusRes.ok) {
        const data: StatusResponse = await statusRes.json();
        dispatch({ type: "HYDRATE_STATUS", payload: data });
      }
      if (signalsRes.ok) {
        const data = await signalsRes.json();
        dispatch({ type: "HYDRATE_SIGNALS", payload: data });
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchStatus();

    function connect() {
      const es = new EventSource("/api/stream");
      esRef.current = es;

      es.onopen = () => {
        dispatch({ type: "CONNECTED" });
        retryRef.current = 0;
      };

      es.onmessage = (e) => {
        try {
          const event: SSEEvent = JSON.parse(e.data);
          dispatch({ type: "SSE", payload: event });

          if (event.type === "signal_sold" || event.type === "signal_resolved") {
            fetchStatus();
          }
        } catch {}
      };

      es.onerror = () => {
        dispatch({ type: "DISCONNECTED" });
        es.close();
        const delay = Math.min(1000 * 2 ** retryRef.current, 30_000);
        retryRef.current++;
        setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
    };
  }, [fetchStatus]);

  return { ...state, refetch: fetchStatus };
}
