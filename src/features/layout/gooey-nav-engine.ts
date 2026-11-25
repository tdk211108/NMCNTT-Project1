import { prefersReducedMotionNow } from '@/lib/client-hooks';
import {
  buildGooeyPipeline,
  clamp01,
  GOOEY_MAX_DROPS,
  GOOEY_MAX_PILLS,
  parseGooeyColor,
  traceGooeyOverlayPath,
  type GooeyBlob,
  type GooeyBox,
} from './gooey-nav-shaders';

export { parseGooeyColor };

export interface GooeyNavSettings {
  animationTime: number;
  particleCount: number;
  timeVariance: number;
  spread: number;
  gooeyness: number;
  wobble: number;
  hoverEffect: boolean;
  pillRgb: number[];
  tints: number[][];
  hoverRgb: number[];
  shadow: number;
}

export interface GooeyNavEngineHandle {
  go: (index: number) => void;
  refresh: () => void;
  destroy: () => void;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PillState {
  mass: number;
  scale: number;
  velocity: number;
  outgoing: number;
}

interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  size: number;
  given: number;
  source: number;
  index: number;
  leave: number;
  emerged: number;
  absorbed: number;
  state: 'waiting' | 'flying' | 'absorbing';
  tint: number[] | null;
  start?: number;
  duration?: number;
  path?: number[];
}

const MARGIN = 48;

const bezier = (a: number, b: number, c: number, d: number, t: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

const travelEase = (t: number) => 1 - (1 - t) ** 3;

/** Creates the WebGL2 SDF metaball + spring physics engine bound to GooeyNav DOM nodes. */
export function createGooeyNavEngine({
  stage,
  canvas,
  list,
  overlay,
  fallback,
  initialIndex,
  getSettings,
}: {
  stage: HTMLDivElement;
  canvas: HTMLCanvasElement;
  list: HTMLDivElement;
  overlay: HTMLDivElement;
  fallback: HTMLSpanElement;
  initialIndex: number;
  getSettings: () => GooeyNavSettings;
}): GooeyNavEngineHandle {
  const reduced = prefersReducedMotionNow();
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
  });
  const pipeline = gl ? buildGooeyPipeline(gl) : null;
  fallback.style.display = pipeline ? 'none' : 'block';
  canvas.style.display = pipeline ? 'block' : 'none';

  const view = { width: 0, height: 0 };
  let rects: Rect[] = [];
  let target = -1;
  const pills = new Map<number, PillState>();
  const drops: Drop[] = [];
  const hover = { x: 0, y: 0, w: 0, h: 0, alpha: 0, index: -1 };
  const pillData = new Float32Array(GOOEY_MAX_PILLS * 4);
  const dropData = new Float32Array(GOOEY_MAX_DROPS * 4);
  const tailData = new Float32Array(GOOEY_MAX_DROPS * 2);
  const tintData = new Float32Array(GOOEY_MAX_DROPS * 3);
  let raf = 0;
  let last = 0;
  let disposed = false;

  const measure = () => {
    const box = stage.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    view.width = box.width;
    view.height = box.height;
    const outerW = box.width + MARGIN * 2;
    const outerH = box.height + MARGIN * 2;
    Object.assign(canvas.style, {
      left: `${-MARGIN}px`,
      top: `${-MARGIN}px`,
      width: `${outerW}px`,
      height: `${outerH}px`,
    });
    const w = Math.max(1, Math.round(outerW * ratio));
    const h = Math.max(1, Math.round(outerH * ratio));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    rects = Array.from(list.children).map((item) => {
      const rect = item.getBoundingClientRect();
      return { x: rect.left - box.left, y: rect.top - box.top, w: rect.width, h: rect.height };
    });
  };

  const pill = (index: number): PillState => {
    let existing = pills.get(index);
    if (!existing) {
      existing = { mass: 0, scale: 0, velocity: 0, outgoing: 0 };
      pills.set(index, existing);
    }
    return existing;
  };

  const shape = (index: number, amount: number): Rect | null => {
    if (index < 0) return null;
    const rect = rects[index];
    if (!rect || amount <= 0.002) return null;
    const h = rect.h * Math.min(1.06, 0.44 + 0.56 * Math.sqrt(Math.max(0, amount)));
    const w = Math.max(h, rect.w * Math.max(0, amount) ** 0.75);
    return { x: rect.x + rect.w / 2 - w / 2, y: rect.y + rect.h / 2 - h / 2, w, h };
  };

  const plan = (drop: Drop, index: number, now: number, fresh: boolean) => {
    const s = getSettings();
    const rect = rects[index];
    if (!rect) return;
    const reach = Math.max(0, s.spread);
    const ex = rect.x + rect.w / 2 + (Math.random() - 0.5) * rect.w * 0.45;
    const ey = rect.y + rect.h / 2 + (Math.random() - 0.5) * rect.h * 0.2;
    const base = Math.max(0.15, s.animationTime / 1000);
    const variance = (Math.random() - 0.5) * (s.timeVariance / 1000);
    const duration = Math.max(0.15, base * (0.62 + Math.random() * 0.32) + variance * 0.6);
    const out = Math.random() * Math.PI * 2;
    const into = Math.random() * Math.PI * 2;
    const burst = reach * (0.7 + Math.random() * 0.6);
    const swing = reach * (0.55 + Math.random() * 0.55);
    const carry = Math.min(duration / 3, 0.12);
    drop.index = index;
    drop.start = now;
    drop.duration = duration;
    drop.path = [
      drop.x,
      drop.y,
      fresh ? drop.x + Math.cos(out) * burst * 1.4 : drop.x + drop.vx * carry,
      fresh ? drop.y + Math.sin(out) * burst * 1.4 : drop.y + drop.vy * carry,
      ex + Math.cos(into) * swing * 1.4,
      ey + Math.sin(into) * swing * 1.4,
      ex,
      ey,
    ];
  };

  const emit = (from: number, to: number, now: number) => {
    const s = getSettings();
    const source = pills.get(from);
    const rect = rects[from];
    if (!source || !rect || !rects[to]) return;
    const available = source.mass - source.outgoing;
    if (available <= 0.002) return;
    const room = GOOEY_MAX_DROPS - drops.length;
    const count = Math.min(room, Math.max(1, Math.round(s.particleCount * available)));
    if (count <= 0) return;
    const win = Math.max(0.15, s.animationTime / 1000) * 0.16;
    for (let i = 0; i < count; i++) {
      const mass = available / count;
      source.outgoing += mass;
      drops.push({
        x: rect.x + rect.w / 2 + (Math.random() - 0.5) * rect.w * 0.6,
        y: rect.y + rect.h / 2 + (Math.random() - 0.5) * rect.h * 0.3,
        vx: 0,
        vy: 0,
        mass,
        size: 0.78 + Math.random() * 0.4,
        given: 0,
        source: from,
        index: to,
        leave: now + Math.random() * win * 1000,
        emerged: 0,
        absorbed: 0,
        state: 'waiting',
        tint: s.tints.length ? s.tints[Math.floor(Math.random() * s.tints.length)] : null,
      });
    }
  };

  const render = () => {
    const s = getSettings();
    const activeBox = target >= 0 ? shape(target, 1) : null;
    const height = rects[target]?.h ?? rects[0]?.h ?? 34;
    const smooth = height * (0.18 + 0.5 * clamp01(s.gooeyness));
    const boxes: GooeyBox[] = [];
    const blobs: GooeyBlob[] = [];
    for (const [index, state] of pills) {
      const box = shape(index, state.scale);
      if (box) boxes.push({ cx: box.x + box.w / 2, cy: box.y + box.h / 2, hw: box.w / 2, hh: box.h / 2 });
    }
    for (const drop of drops) {
      if (drop.state === 'waiting') continue;
      const radius = 0.25 * height * drop.size * Math.min(drop.emerged, 1 - drop.absorbed);
      if (radius <= 0.05) continue;
      const speed = Math.hypot(drop.vx, drop.vy);
      const length = Math.min(radius * 1.1, speed * 0.018);
      blobs.push({
        x: drop.x,
        y: drop.y,
        r: radius,
        tx: speed > 0.01 ? (drop.vx / speed) * length : 0,
        ty: speed > 0.01 ? (drop.vy / speed) * length : 0,
        tint: drop.tint,
      });
    }

    const traced =
      boxes.length > 0 || blobs.length > 0
        ? traceGooeyOverlayPath(boxes, blobs, smooth, view.width, view.height)
        : '';
    if (traced) {
      overlay.style.clipPath = `path('${traced}')`;
      overlay.style.visibility = 'visible';
    } else {
      overlay.style.clipPath = 'inset(100%)';
      overlay.style.visibility = 'hidden';
    }

    if (!pipeline || !gl) {
      if (activeBox) {
        fallback.style.transform = `translate(${activeBox.x.toFixed(2)}px, ${activeBox.y.toFixed(2)}px)`;
        fallback.style.width = `${activeBox.w}px`;
        fallback.style.height = `${activeBox.h}px`;
        fallback.style.opacity = '1';
      } else {
        fallback.style.opacity = '0';
      }
      return;
    }

    let slot = 0;
    for (const box of boxes) {
      if (slot >= GOOEY_MAX_PILLS) break;
      pillData[slot * 4] = box.cx + MARGIN;
      pillData[slot * 4 + 1] = box.cy + MARGIN;
      pillData[slot * 4 + 2] = box.hw;
      pillData[slot * 4 + 3] = box.hh;
      slot += 1;
    }
    pillData.fill(0, slot * 4);

    let count = 0;
    for (const blob of blobs) {
      if (count >= GOOEY_MAX_DROPS) break;
      dropData[count * 4] = blob.x + MARGIN;
      dropData[count * 4 + 1] = blob.y + MARGIN;
      dropData[count * 4 + 2] = blob.r;
      dropData[count * 4 + 3] = 0;
      tailData[count * 2] = blob.tx;
      tailData[count * 2 + 1] = blob.ty;
      const tint = blob.tint || s.pillRgb;
      tintData[count * 3] = tint[0];
      tintData[count * 3 + 1] = tint[1];
      tintData[count * 3 + 2] = tint[2];
      count += 1;
    }

    const { program, uniforms, buffer, position } = pipeline;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(uniforms.uSize, view.width + MARGIN * 2, view.height + MARGIN * 2);
    gl.uniform1f(uniforms.uRatio, canvas.width / Math.max(1, view.width + MARGIN * 2));
    gl.uniform4fv(uniforms.uPills, pillData);
    gl.uniform4f(uniforms.uHover, hover.x + MARGIN, hover.y + MARGIN, hover.w / 2, hover.h / 2);
    gl.uniform4fv(uniforms.uDrops, dropData);
    gl.uniform2fv(uniforms.uTails, tailData);
    gl.uniform3fv(uniforms.uTints, tintData);
    gl.uniform1i(uniforms.uCount, count);
    gl.uniform1f(uniforms.uSmooth, smooth);
    gl.uniform3f(uniforms.uPill, s.pillRgb[0], s.pillRgb[1], s.pillRgb[2]);
    gl.uniform4f(
      uniforms.uHoverColor,
      s.hoverRgb[0],
      s.hoverRgb[1],
      s.hoverRgb[2],
      s.hoverRgb[3] * hover.alpha,
    );
    gl.uniform1f(uniforms.uShadow, s.shadow);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const frame = (now: number) => {
    raf = 0;
    const s = getSettings();
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    const emergeTime = 0.09;
    const absorbTime = 0.12;

    for (let i = drops.length - 1; i >= 0; i--) {
      const drop = drops[i];
      if (drop.state === 'waiting') {
        if (now < drop.leave) continue;
        drop.state = 'flying';
        plan(drop, drop.index, now, true);
      }
      if (drop.state === 'flying') {
        drop.emerged = Math.min(1, drop.emerged + dt / emergeTime);
        const source = pills.get(drop.source);
        if (source && drop.given < drop.mass) {
          const step = Math.min(drop.mass * (dt / emergeTime), drop.mass - drop.given);
          source.mass = Math.max(0, source.mass - step);
          source.outgoing = Math.max(0, source.outgoing - step);
          drop.given += step;
        }
        const t = clamp01((now - (drop.start ?? now)) / 1000 / (drop.duration ?? 1));
        const eased = travelEase(t);
        const [x0, y0, x1, y1, x2, y2, x3, y3] = drop.path ?? [
          drop.x,
          drop.y,
          drop.x,
          drop.y,
          drop.x,
          drop.y,
          drop.x,
          drop.y,
        ];
        const x = bezier(x0, x1, x2, x3, eased);
        const y = bezier(y0, y1, y2, y3, eased);
        if (dt > 0) {
          drop.vx = (x - drop.x) / dt;
          drop.vy = (y - drop.y) / dt;
        }
        drop.x = x;
        drop.y = y;
        if (t >= 1) drop.state = 'absorbing';
      }
      if (drop.state === 'absorbing') {
        const step = Math.min(1 - drop.absorbed, dt / absorbTime);
        drop.absorbed += step;
        drop.vx *= 0.8;
        drop.vy *= 0.8;
        const host = pill(drop.index);
        host.mass = Math.min(1, host.mass + drop.mass * step);
        if (drop.absorbed >= 1) drops.splice(i, 1);
      }
    }

    const zeta = reduced ? 1 : 1 - 0.72 * clamp01(s.wobble);
    const omega = 26;
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    for (const [index, state] of pills) {
      for (let n = 0; n < steps; n++) {
        state.velocity += (omega * omega * (state.mass - state.scale) - 2 * zeta * omega * state.velocity) * h;
        state.scale += state.velocity * h;
      }
      if (index !== target && state.mass <= 0.002 && state.outgoing <= 0.002 && Math.abs(state.scale) < 0.004) {
        pills.delete(index);
      }
    }

    if (hover.index >= 0 && rects[hover.index]) {
      const rect = rects[hover.index];
      const k = 1 - Math.exp(-dt / 0.06);
      hover.x += (rect.x + rect.w / 2 - hover.x) * k;
      hover.y += (rect.y + rect.h / 2 - hover.y) * k;
      hover.w += (rect.w - hover.w) * k;
      hover.h += (rect.h - hover.h) * k;
    }
    const hoverGoal = s.hoverEffect && hover.index >= 0 && hover.index !== target ? 1 : 0;
    hover.alpha += (hoverGoal - hover.alpha) * (1 - Math.exp(-dt / 0.08));

    render();

    const host = target >= 0 ? pills.get(target) : undefined;
    const resting =
      drops.length === 0 &&
      (target < 0
        ? pills.size === 0
        : pills.size === 1 &&
          Boolean(host) &&
          Math.abs((host?.mass ?? 0) - (host?.scale ?? 0)) < 0.0008 &&
          Math.abs(host?.velocity ?? 0) < 0.004);
    const hoverRect = rects[hover.index];
    const hovering =
      Math.abs(hoverGoal - hover.alpha) > 0.003 ||
      (hoverRect &&
        Math.abs(hoverRect.x + hoverRect.w / 2 - hover.x) + Math.abs(hoverRect.w - hover.w) > 0.1);
    if (!resting || hovering) raf = requestAnimationFrame(frame);
    else {
      if (host) {
        host.mass = 1;
        host.scale = 1;
        host.velocity = 0;
      }
      hover.alpha = hoverGoal;
      render();
    }
  };

  const wake = () => {
    if (raf || disposed) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const settle = (index: number) => {
    pills.clear();
    drops.length = 0;
    target = index;
    if (index >= 0) {
      const state = pill(index);
      state.mass = 1;
      state.scale = 1;
      state.velocity = 0;
    }
    render();
  };

  const go = (index: number, shouldAnimate: boolean) => {
    if (index === target) return;
    if (index < 0 || !rects[index] || !shouldAnimate || reduced) {
      settle(index);
      return;
    }
    const now = performance.now();
    const hadPrevious = target >= 0;
    target = index;

    if (!hadPrevious) {
      const dest = rects[index];
      const s = getSettings();
      const p = pill(index);
      p.mass = 0.25;
      p.scale = 0.25;
      p.velocity = 0;

      const burstCount = Math.min(GOOEY_MAX_DROPS - drops.length, Math.max(6, Math.round(s.particleCount * 0.6)));
      const win = Math.max(0.12, s.animationTime / 1000) * 0.14;
      for (let i = 0; i < burstCount; i += 1) {
        const angle = (Math.PI * 2 * i) / Math.max(1, burstCount) + (Math.random() - 0.5) * 0.4;
        const dist = Math.max(18, s.spread * 0.72);
        drops.push({
          x: dest.x + dest.w / 2 + Math.cos(angle) * dist,
          y: dest.y + dest.h / 2 + Math.sin(angle) * Math.min(22, dist * 0.45),
          vx: 0,
          vy: 0,
          mass: 0.75 / Math.max(1, burstCount),
          size: 0.75 + Math.random() * 0.35,
          given: 0,
          source: -1,
          index,
          leave: now + Math.random() * win * 1000,
          emerged: 0,
          absorbed: 0,
          state: 'waiting',
          tint: s.tints.length ? s.tints[Math.floor(Math.random() * s.tints.length)] : null,
        });
      }
      wake();
      return;
    }

    pill(index);
    for (const drop of drops) {
      drop.index = index;
      if (drop.state === 'flying') plan(drop, index, now, false);
      if (drop.state === 'absorbing') {
        drop.state = 'flying';
        drop.mass *= 1 - drop.absorbed;
        drop.absorbed = 0;
        plan(drop, index, now, false);
      }
    }
    for (const from of [...pills.keys()]) {
      if (from !== index) emit(from, index, now);
    }
    wake();
  };

  const onOver = (event: PointerEvent) => {
    const item = (event.target as Element).closest<HTMLElement>('[data-gooey-index]');
    if (!item || !list.contains(item)) return;
    const index = Number(item.dataset.gooeyIndex);
    const rect = rects[index];
    if (!rect) return;
    if (hover.alpha < 0.01) {
      hover.x = rect.x + rect.w / 2;
      hover.y = rect.y + rect.h / 2;
      hover.w = rect.w;
      hover.h = rect.h;
    }
    hover.index = index;
    wake();
  };

  const onLeave = () => {
    hover.index = -1;
    wake();
  };

  const resizeObserver =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          measure();
          if (!drops.length) settle(target);
          else render();
        })
      : null;
  resizeObserver?.observe(stage);
  resizeObserver?.observe(list);
  list.addEventListener('pointerover', onOver);
  list.addEventListener('pointerleave', onLeave);

  measure();
  settle(initialIndex);
  document.fonts?.ready.then(() => {
    if (disposed) return;
    measure();
    if (!drops.length) settle(target);
  });

  return {
    go: (idx) => go(idx, true),
    refresh: () => {
      render();
      wake();
    },
    destroy: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      list.removeEventListener('pointerover', onOver);
      list.removeEventListener('pointerleave', onLeave);
      if (gl && pipeline) {
        gl.deleteBuffer(pipeline.buffer);
        gl.deleteProgram(pipeline.program);
      }
    },
  };
}
