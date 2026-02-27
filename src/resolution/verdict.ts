export function isCorrect(
  direction: "up" | "down",
  priceAtSignal: number,
  priceAtResolution: number,
): boolean {
  if (direction === "up") return priceAtResolution > priceAtSignal;
  return priceAtResolution < priceAtSignal;
}

export function calculateTradePnl(
  amountUSDC: number,
  priceAtTrade: number,
  priceAtResolution: number,
): number {
  return amountUSDC * (priceAtResolution / priceAtTrade - 1);
}

export function calculatePriceDelta(
  priceAtSignal: number,
  priceAtResolution: number,
): { delta: number; formatted: string } {
  const delta = ((priceAtResolution - priceAtSignal) / priceAtSignal) * 100;
  const sign = delta >= 0 ? "+" : "";
  return { delta, formatted: `${sign}${delta.toFixed(1)}%` };
}
