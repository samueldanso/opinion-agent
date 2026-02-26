export interface ParsedSignal {
  direction: "up" | "down";
  confidence: number;
  reasoning: string;
}

export function parseSignalResponse(raw: string): ParsedSignal {
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  const parsed = JSON.parse(cleaned);

  const direction = parsed.direction?.toLowerCase();
  if (direction !== "up" && direction !== "down") {
    throw new Error(`Invalid direction: ${parsed.direction}`);
  }

  const confidence = Math.min(100, Math.max(0, Math.round(Number(parsed.confidence))));
  if (Number.isNaN(confidence)) {
    throw new Error(`Invalid confidence: ${parsed.confidence}`);
  }

  const reasoning = String(parsed.reasoning || "No reasoning provided");

  return { direction, confidence, reasoning };
}
