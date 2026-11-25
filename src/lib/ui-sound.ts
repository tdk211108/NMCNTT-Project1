import { APPLE_PAY_SFX_PATH } from '@/shared/constants';

export type UiSoundKind = 'click' | 'toggle' | 'success' | 'modal';

export const UI_SFX_STORAGE_KEY = 'coreraster-ui-sfx';
export const DEFAULT_UI_SFX_ENABLED = true;
const UI_SFX_EVENT = 'coreraster-ui-sfx-change';
const DELIVERY_SFX_GAIN = 0.85;

let sharedAudioCtx: AudioContext | null = null;
let sharedNoiseBuffer: AudioBuffer | null = null;
let applePayBytesPromise: Promise<ArrayBuffer | null> | null = null;
let applePayDecodedCtx: AudioContext | null = null;
let applePayBuffer: AudioBuffer | null = null;
let applePayTrimOffsetSec = 0;
let applePayDecodePromise: Promise<AudioBuffer | null> | null = null;

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

function loadApplePayBytes(): Promise<ArrayBuffer | null> {
  if (typeof fetch !== 'function') {
    return Promise.resolve(null);
  }
  if (!applePayBytesPromise) {
    applePayBytesPromise = fetch(APPLE_PAY_SFX_PATH)
      .then(async (res) => {
        if (!res.ok) {
          applePayBytesPromise = null;
          return null;
        }
        return res.arrayBuffer();
      })
      .catch(() => {
        applePayBytesPromise = null;
        return null;
      });
  }
  return applePayBytesPromise;
}

function computeLeadingTrimOffsetSec(buffer: AudioBuffer): number {
  if (!buffer.numberOfChannels || typeof buffer.getChannelData !== 'function' || buffer.sampleRate <= 0) {
    return 0;
  }
  const threshold = 0.002;
  const safetySamples = Math.round(buffer.sampleRate * 0.002);
  let earliest = buffer.length;

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    const limit = Math.min(data.length, earliest);
    for (let i = 0; i < limit; i += 1) {
      if (Math.abs(data[i] ?? 0) > threshold) {
        earliest = i;
        break;
      }
    }
  }

  if (earliest >= buffer.length) {
    return 0;
  }
  return Math.max(0, (earliest - safetySamples) / buffer.sampleRate);
}

function ensureApplePayBuffer(ctx: AudioContext): Promise<AudioBuffer | null> {
  if (applePayDecodedCtx === ctx && applePayBuffer) {
    return Promise.resolve(applePayBuffer);
  }
  if (applePayDecodedCtx !== ctx) {
    applePayDecodedCtx = ctx;
    applePayBuffer = null;
    applePayTrimOffsetSec = 0;
    applePayDecodePromise = null;
  }
  if (!applePayDecodePromise) {
    applePayDecodePromise = loadApplePayBytes()
      .then(async (bytes) => {
        if (!bytes || typeof ctx.decodeAudioData !== 'function') {
          applePayDecodePromise = null;
          return null;
        }
        // Clone before decodeAudioData because Web Audio detaches the input ArrayBuffer.
        const decoded = await ctx.decodeAudioData(bytes.slice(0));
        if (applePayDecodedCtx === ctx) {
          applePayBuffer = decoded;
          applePayTrimOffsetSec = computeLeadingTrimOffsetSec(decoded);
        }
        return decoded;
      })
      .catch(() => {
        if (applePayDecodedCtx === ctx) {
          applePayDecodePromise = null;
        }
        return null;
      });
  }
  return applePayDecodePromise;
}

/** Prefetch `/applepay.mp3` bytes ahead of user interaction when UI SFX is enabled. */
export function preloadOrderDeliveredSfx(): void {
  if (!readUiSfxEnabled()) return;
  void loadApplePayBytes();
  const ctx = sharedAudioCtx;
  if (ctx && ctx.state !== 'closed') {
    void ensureApplePayBuffer(ctx);
  }
}

/** Pre-create and resume the interactive AudioContext on early user gestures to eliminate first-click lag. */
export function warmUiAudio(): void {
  if (!readUiSfxEnabled()) return;
  const ctx = resolveAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {});
  }
  void ensureApplePayBuffer(ctx);
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

/** Returns true only when an order transitions from an incomplete stage to delivered (stage 4). */
export function shouldTriggerOrderDeliveredSfx(
  previousStage: number,
  updated: { stage: number; isCompleted: boolean },
): boolean {
  return previousStage < 4 && updated.isCompleted && updated.stage >= 4;
}

function playApplePayHtmlAudioFallback(): void {
  if (typeof Audio !== 'function') return;
  try {
    const audio = new Audio(APPLE_PAY_SFX_PATH);
    audio.volume = DELIVERY_SFX_GAIN;
    void audio.play().catch(() => {});
  } catch {
    // Ignore HTMLAudio fallback errors cleanly.
  }
}

function dispatchApplePayBuffer(
  ctx: AudioContext,
  buffer: AudioBuffer,
  offsetSec: number,
): void {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(DELIVERY_SFX_GAIN, ctx.currentTime);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(0, offsetSec);
}

/** Play `/applepay.mp3` synchronously when decoded (0ms latency), or decode/fallback otherwise. */
export async function playOrderDeliveredSfx(
  options?: { force?: boolean; storage?: Pick<Storage, 'getItem'> | null },
): Promise<void> {
  if (!options?.force && !readUiSfxEnabled(options?.storage)) {
    return;
  }

  const ctx = resolveAudioContext();
  if (!ctx) {
    playApplePayHtmlAudioFallback();
    return;
  }

  // Fast path: trigger immediately inside the user's click gesture without waiting on microtasks.
  if (ctx.state === 'running' && applePayDecodedCtx === ctx && applePayBuffer) {
    try {
      dispatchApplePayBuffer(ctx, applePayBuffer, applePayTrimOffsetSec);
      return;
    } catch {
      playApplePayHtmlAudioFallback();
      return;
    }
  }

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    const buffer = await ensureApplePayBuffer(ctx);
    if (!options?.force && !readUiSfxEnabled(options?.storage)) {
      return;
    }
    if (!buffer) {
      playApplePayHtmlAudioFallback();
      return;
    }

    dispatchApplePayBuffer(ctx, buffer, applePayTrimOffsetSec);
  } catch {
    playApplePayHtmlAudioFallback();
  }
}

/** Reset cached AudioContext and decoded SFX buffers (intended for deterministic tests). */
export function resetUiSfxCachesForTest(): void {
  sharedAudioCtx = null;
  sharedNoiseBuffer = null;
  applePayBytesPromise = null;
  applePayDecodedCtx = null;
  applePayBuffer = null;
  applePayTrimOffsetSec = 0;
  applePayDecodePromise = null;
}
