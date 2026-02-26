import { PinionClient, payX402Service } from "pinion-os";

const SIGNAL_URL = process.env.SIGNAL_URL || "http://localhost:4020/signal/eth";

async function main() {
  const pinion = new PinionClient({
    privateKey: process.env.PINION_PRIVATE_KEY!,
  });

  console.log(`Calling SIGINT signal endpoint: ${SIGNAL_URL}`);
  console.log(`Paying with wallet: ${pinion.address}\n`);

  const signal = await payX402Service(pinion.signer, SIGNAL_URL);

  console.log("Signal received:");
  console.log(JSON.stringify(signal, null, 2));
  console.log(`\nDirection: ${signal.direction}`);
  console.log(`Confidence: ${signal.confidence}%`);
  console.log(`Trade proof: ${signal.tradeHash}`);
  console.log(`Track record: ${signal.trackRecord.correct}/${signal.trackRecord.total}`);
}

main().catch(console.error);
