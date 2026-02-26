import { getDb } from "./db";
import { boot, startLoop } from "./agent";
import { startApiServer, startSkillServer } from "./server";

async function main(): Promise<void> {
  getDb();

  await boot();

  startSkillServer();
  startApiServer();
  startLoop();
}

main().catch((err) => {
  console.error("Fatal boot error:", err);
  process.exit(1);
});
