export interface ParsedSignal {
  direction: "up" | "down";
  confidence: number;
  reasoning: string;
}

export function parseSignalResponse(raw: string): ParsedSignal {
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`No JSON found in response: ${cleaned.slice(0, 100)}`);
    parsed = JSON.parse(match[0]) as Record<string, unknown>;
  }

  const direction = (parsed.direction as string | undefined)?.toLowerCase();
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
