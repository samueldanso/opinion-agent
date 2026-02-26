import { emit } from "../events";

export function say(text: string): void {
  console.log(`[SIGINT] ${text}`);
  emit({ type: "monologue", text });
}
