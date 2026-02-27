import { getDb, insertMonologue, getRecentMonologue } from "../db";
import { emit } from "../events";

const MAX_LINES = 100;
const _buffer: string[] = [];
let _loaded = false;

function ensureLoaded(): void {
  if (_loaded) return;
  _loaded = true;
  try {
    const history = getRecentMonologue(getDb(), MAX_LINES);
    _buffer.push(...history);
  } catch {
    // DB not ready yet (e.g. called before initSchema) — skip, will persist going forward
  }
}

export function say(text: string): void {
  console.log(`[SIGINT] ${text}`);
  ensureLoaded();
  _buffer.push(text);
  if (_buffer.length > MAX_LINES) _buffer.shift();
  try {
    insertMonologue(getDb(), text);
  } catch {
    // Non-fatal — SSE and buffer still work
  }
  emit({ type: "monologue", text });
}

export function getMonologueHistory(): string[] {
  ensureLoaded();
  return [..._buffer];
}
