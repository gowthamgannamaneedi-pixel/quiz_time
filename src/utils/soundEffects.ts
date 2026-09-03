/**
 * Bulletproof local sound generator for the 3-second pre-quiz countdown.
 * Zero external downloads. Includes Web Audio synthesizer and fallback audio generation.
 * Automatically unlocks audio context upon first user interaction (click/touch/key).
 */

let globalAudioCtx: any = null;
let isUnlocked = false;

/**
 * Prime and unlock audio context on user gesture
 */
export function unlockAudio() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!globalAudioCtx) {
      globalAudioCtx = new AudioContextClass();
    }
    if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().then(() => {
        isUnlocked = true;
      }).catch(() => {});
    } else if (globalAudioCtx.state === 'running') {
      isUnlocked = true;
    }
  } catch {
    // ignore
  }
}

// Global user-gesture listeners to auto-unlock audio seamlessly on any first tap/click
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  const handleInteraction = () => {
    unlockAudio();
    if (isUnlocked && globalAudioCtx && globalAudioCtx.state === 'running') {
      window.removeEventListener('click', handleInteraction, true);
      window.removeEventListener('touchstart', handleInteraction, true);
      window.removeEventListener('keydown', handleInteraction, true);
    }
  };

  window.addEventListener('click', handleInteraction, true);
  window.addEventListener('touchstart', handleInteraction, true);
  window.addEventListener('keydown', handleInteraction, true);
}

function getAudioContext(): any {
  unlockAudio();
  return globalAudioCtx;
}

/**
 * Play an authoritative countdown tick beep (3, 2, 1)
 */
export function playCountdownTick(tick: number) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Pitch: 3 & 2 = 520Hz, 1 = 680Hz
    const freq = tick === 1 ? 680 : 520;
    const duration = 0.15;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Autoplay restrictions or unavailable audio device - safely ignore
  }
}

/**
 * Play a start chime when countdown completes and Question 1 begins
 */
export function playCountdownGo() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [880, 1108]; // A5 + C#6 chord
    const duration = 0.3;

    notes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    });
  } catch {
    // Autoplay restrictions or unavailable audio device - safely ignore
  }
}
