"use client";

import { useEffect, useReducer, useRef, useCallback } from "react";
import type { AgentState, SSEEvent, StatusResponse } from "@/lib/types";
import { deriveTier } from "@/lib/utils";

const MAX_MONOLOGUE = 100;

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
  totalPredictions: 0,
  correctCount: 0,
  last5: [],
  predictions: [],
  monologue: [],
  unlimitedKey: null,
};

type Action =
  | { type: "CONNECTED" }
  | { type: "DISCONNECTED" }
  | { type: "HYDRATE"; payload: StatusResponse }
  | { type: "SSE"; payload: SSEEvent };

function reducer(state: AgentState, action: Action): AgentState {
  switch (action.type) {
    case "CONNECTED":
      return { ...state, connected: true };
    case "DISCONNECTED":
      return { ...state, connected: false };
    case "HYDRATE": {
      const { trackRecord, predictions } = action.payload;
      return {
        ...state,
        accuracy: trackRecord.accuracy,
        totalPredictions: trackRecord.totalPredictions,
        correctCount: trackRecord.correct,
        last5: trackRecord.last5,
        predictions,
      };
    }
    case "SSE": {
      const event = action.payload;
      switch (event.type) {
        case "price_update":
          return { ...state, price: event.price };
        case "prediction_sold":
          return state;
        case "prediction_resolved":
          return {
            ...state,
            accuracy: event.accuracy,
          };
        case "balance_update":
          return {
            ...state,
            usdc: event.usdc,
            runway: event.runway,
            ratio: event.ratio,
            earned: event.earned,
            spent: event.spent,
            tier: deriveTier(event.ratio),
          };
        case "monologue":
          return {
            ...state,
            monologue: [...state.monologue, event.text].slice(-MAX_MONOLOGUE),
          };
        case "unlimited_purchased":
          return { ...state, unlimitedKey: event.apiKey };
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
      const res = await fetch("/api/status");
      if (res.ok) {
        const data: StatusResponse = await res.json();
        dispatch({ type: "HYDRATE", payload: data });
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

          if (event.type === "prediction_sold" || event.type === "prediction_resolved") {
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
