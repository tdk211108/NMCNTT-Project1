export type UiSoundKind = 'click' | 'toggle' | 'success' | 'modal';

export const UI_SFX_STORAGE_KEY = 'coreraster-ui-sfx';
export const DEFAULT_UI_SFX_ENABLED = true;
const UI_SFX_EVENT = 'coreraster-ui-sfx-change';

let sharedAudioCtx: AudioContext | null = null;
let sharedNoiseBuffer: AudioBuffer | null = null;

/** Parse persisted SFX flag strictly; defaults to enabled (`true`). */
export function parseStoredUiSfx(value: unknown): boolean {
  if (value === 'off' || value === 'false') return false;
  return DEFAULT_UI_SFX_ENABLED;
}

export function readUiSfxEnabled(
  storage?: Pick<Storage, 'getItem'> | null,
): boolean {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
        ? window.localStorage
        : null;
  if (!targetStorage) return DEFAULT_UI_SFX_ENABLED;
  try {
    return parseStoredUiSfx(targetStorage.getItem(UI_SFX_STORAGE_KEY));
  } catch {
    return DEFAULT_UI_SFX_ENABLED;
  }
}

export function setUiSfxEnabled(
  enabled: boolean,
  options?: { storage?: Pick<Storage, 'setItem'> | null },
): void {
  const storage =
    options?.storage !== undefined
      ? options.storage
      : typeof window !== 'undefined'
        ? window.localStorage
        : null;

  if (storage) {
    try {
      storage.setItem(UI_SFX_STORAGE_KEY, enabled ? 'on' : 'off');
    } catch {
      // Ignore storage quota / privacy mode failures.
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(UI_SFX_EVENT));
  }
}

export function subscribeUiSfx(onStoreChange: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === UI_SFX_STORAGE_KEY) {
      onStoreChange();
    }
  };
  window.addEventListener('storage', handleStorage);
  window.addEventListener(UI_SFX_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(UI_SFX_EVENT, onStoreChange);
  };
}

export function getUiSfxSnapshot(): boolean {
  return readUiSfxEnabled();
}

export function getUiSfxServerSnapshot(): boolean {
  return DEFAULT_UI_SFX_ENABLED;
}

function resolveAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      try {
        sharedAudioCtx = new AudioCtx({ latencyHint: 'interactive' });
      } catch {
        sharedAudioCtx = new AudioCtx();
      }
      sharedNoiseBuffer = null;
    }
    if (!sharedNoiseBuffer) {
      sharedNoiseBuffer = buildNoiseBuffer(sharedAudioCtx);
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function buildNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * 0.014));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  return buffer;
}

/** Pre-create and resume the interactive AudioContext on early user gestures to eliminate first-click lag. */
export function warmUiAudio(): void {
  if (!readUiSfxEnabled()) return;
  const ctx = resolveAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {});
  }
}

function triggerTone(
  ctx: AudioContext,
  startAt: number,
  durationSec: number,
  freqStart: number,
  freqEnd: number,
  gainPeak: number,
  type: OscillatorType = 'triangle',
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, startAt);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), startAt + durationSec);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(gainPeak, startAt + 0.0006);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + durationSec + 0.003);
}

function dispatchSound(ctx: AudioContext, kind: UiSoundKind): void {
  try {
    const now = ctx.currentTime;

    if (kind === 'toggle') {
      triggerTone(ctx, now, 0.013, 1220, 720, 0.085, 'sine');
      return;
    }

    if (kind === 'success') {
      triggerTone(ctx, now, 0.022, 620, 680, 0.08, 'triangle');
      triggerTone(ctx, now + 0.018, 0.032, 920, 990, 0.08, 'sine');
      return;
    }

    if (kind === 'modal') {
      triggerTone(ctx, now, 0.018, 360, 210, 0.075, 'sine');
      return;
    }

    triggerTone(ctx, now, 0.013, 980, 340, 0.095, 'triangle');
    const noiseBuffer = sharedNoiseBuffer ?? buildNoiseBuffer(ctx);
    sharedNoiseBuffer = noiseBuffer;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600, now);
    filter.Q.setValueAtTime(1.5, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.013);
  } catch {
    // Ignore audio graph errors cleanly.
  }
}

/** Synthesize zero-latency tactile mechanical UI click feedback via Web Audio API. */
export function playUiSound(
  kind: UiSoundKind = 'click',
  options?: { force?: boolean },
): void {
  if (!options?.force && !readUiSfxEnabled()) {
    return;
  }

  const ctx = resolveAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    void ctx
      .resume()
      .then(() => {
        dispatchSound(ctx, kind);
      })
      .catch(() => {});
    return;
  }

  dispatchSound(ctx, kind);
}
