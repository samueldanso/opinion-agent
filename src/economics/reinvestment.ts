import { emit } from "../events";
import type { EconomicState } from "./tracker";

export function evaluateReinvestment(state: EconomicState): boolean {
  if (state.ratio > 1.0 && state.totalEarned > 5) {
    emit({
      type: "reinvestment",
      amount: state.totalEarned * 0.1,
      into: "extended onchain context",
    });
    emit({
      type: "monologue",
      text: `Reinvesting — ratio ${state.ratio.toFixed(2)} supports deeper analysis.`,
    });
    return true;
  }

  if (state.ratio < 0.5) {
    emit({
      type: "monologue",
      text: `Cost-cutting mode — ratio ${state.ratio.toFixed(2)}, reducing to price fetch only.`,
    });
    return false;
  }

  return false;
}
