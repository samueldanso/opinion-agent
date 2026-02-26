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
