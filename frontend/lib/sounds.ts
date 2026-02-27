let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  return ctx;
}

export function playKeystroke(): void {
  try {
    const ac = getContext();
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = "square";
    osc.frequency.value = 800 + Math.random() * 400;

    gain.gain.value = 0.03;
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start();
    osc.stop(ac.currentTime + 0.05);
  } catch {}
}

export function playClick(): void {
  try {
    const ac = getContext();
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = "sine";
    osc.frequency.value = 1200;

    gain.gain.value = 0.05;
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start();
    osc.stop(ac.currentTime + 0.03);
  } catch {}
}

export function playAmbientHum(): { stop: () => void } {
  try {
    const ac = getContext();
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = "sine";
    osc.frequency.value = 60;

    gain.gain.value = 0.01;

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start();

    return {
      stop: () => {
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
        osc.stop(ac.currentTime + 0.5);
      },
    };
  } catch {
    return { stop: () => {} };
  }
}
