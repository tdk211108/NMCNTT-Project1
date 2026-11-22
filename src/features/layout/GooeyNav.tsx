'use client';

import Link from 'next/link';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useThemeMode } from './useThemeMode';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export interface GooeyNavItem {
  href: string;
  label: string;
  testId?: string;
}

export interface GooeyNavProps {
  items: readonly GooeyNavItem[];
  activeHref: string;
  size?: 'sm' | 'md';
  animationTime?: number;
  particleCount?: number;
  gooeyness?: number;
  wobble?: number;
  className?: string;
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

interface Box {
  cx: number;
  cy: number;
  hw: number;
  hh: number;
}

interface Blob {
  x: number;
  y: number;
  r: number;
  tx: number;
  ty: number;
  tint: number[] | null;
}

interface Pipeline {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
  buffer: WebGLBuffer;
  position: number;
}

const MAX_DROPS = 28;
const MAX_PILLS = 4;
const MARGIN = 48;

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT = `#version 300 es
precision highp float;

uniform vec2 uSize;
uniform float uRatio;
uniform vec4 uPills[${MAX_PILLS}];
uniform vec4 uHover;
uniform vec4 uDrops[${MAX_DROPS}];
uniform vec2 uTails[${MAX_DROPS}];
uniform vec3 uTints[${MAX_DROPS}];
uniform int uCount;
uniform float uSmooth;
uniform vec3 uPill;
uniform vec4 uHoverColor;
uniform float uShadow;

out vec4 outColor;

float sdPill(vec2 p, vec4 box) {
  vec2 extent = max(box.zw, vec2(0.0));
  float r = min(extent.x, extent.y);
  vec2 q = abs(p - box.xy) - extent + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

vec4 blend(vec4 a, vec4 b, float k) {
  float h = clamp(0.5 + 0.5 * (b.w - a.w) / k, 0.0, 1.0);
  return vec4(mix(b.rgb, a.rgb, h), mix(b.w, a.w, h) - k * h * (1.0 - h));
}

vec4 field(vec2 p) {
  vec4 shape = vec4(uPill, 1e5);
  for (int i = 0; i < ${MAX_PILLS}; i++) {
    vec4 pill = uPills[i];
    if (pill.z <= 0.0) continue;
    shape = blend(shape, vec4(uPill, sdPill(p, pill)), uSmooth);
  }
  for (int i = 0; i < ${MAX_DROPS}; i++) {
    if (i >= uCount) break;
    vec4 drop = uDrops[i];
    if (drop.z <= 0.0) continue;
    float d = sdCapsule(p, drop.xy, drop.xy - uTails[i], drop.z);
    if (d > shape.w + uSmooth) continue;
    shape = blend(shape, vec4(uTints[i], d), uSmooth);
  }
  return shape;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uRatio - gl_FragCoord.y) / uRatio;
  vec4 shape = field(p);
  float d = shape.w;
  float aa = max(fwidth(d), 0.35);
  float body = clamp(0.5 - d / aa, 0.0, 1.0);

  vec2 grad = vec2(dFdx(d), -dFdy(d));
  vec2 n = length(grad) > 0.0001 ? normalize(grad) : vec2(0.0, 1.0);
  float rim = (1.0 - smoothstep(0.0, 1.6, -d)) * max(0.0, -n.y) * 0.25;
  vec3 fill = mix(shape.rgb, vec3(1.0), rim);

  float lifted = field(p - vec2(0.0, 2.5)).w;
  float shadow = (1.0 - smoothstep(-2.5, 7.0, lifted)) * uShadow * (1.0 - body);
  float hover = clamp(0.5 - sdPill(p, uHover) / aa, 0.0, 1.0) * uHoverColor.a;

  vec4 color = vec4(0.0, 0.0, 0.0, shadow);
  color = vec4(uHoverColor.rgb * hover, hover) + color * (1.0 - hover);
  color = vec4(fill * body, body) + color * (1.0 - body);
  outColor = color;
}
`;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const bezier = (a: number, b: number, c: number, d: number, t: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

const travelEase = (t: number) => 1 - (1 - t) ** 3;

function traceOverlayPath(boxes: Box[], blobs: Blob[], smooth: number, width: number, height: number): string {
  if (width <= 0 || height <= 0 || (boxes.length === 0 && blobs.length === 0)) {
    return '';
  }

  const field = (x: number, y: number) => {
    let d = 1e5;
    const merge = (value: number) => {
      const h = clamp01(0.5 + (0.5 * (value - d)) / smooth);
      d = value + (d - value) * h - smooth * h * (1 - h);
    };
    for (const box of boxes) {
      const r = Math.min(box.hw, box.hh);
      const qx = Math.abs(x - box.cx) - box.hw + r;
      const qy = Math.abs(y - box.cy) - box.hh + r;
      merge(Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r);
    }
    for (const blob of blobs) {
      const px = x - blob.x;
      const py = y - blob.y;
      const bx = -blob.tx;
      const by = -blob.ty;
      const span = bx * bx + by * by;
      const h = span > 0.0001 ? clamp01((px * bx + py * by) / span) : 0;
      const value = Math.hypot(px - bx * h, py - by * h) - blob.r;
      if (value > d + smooth) continue;
      merge(value);
    }
    return d;
  };

  const step = 2;
  const parts: string[] = [];
  const maxY = Math.ceil(height);
  for (let y = 0; y < maxY; y += 1) {
    const cy = y + 0.5;
    let previous = field(0, cy);
    let start: number | null = previous < 0 ? 0 : null;
    for (let x = step; x <= width + step; x += step) {
      const sampleX = Math.min(x, width);
      const value = field(sampleX, cy);
      if ((previous < 0) !== (value < 0)) {
        const cross = x - step + (step * previous) / (previous - value);
        if (value < 0) start = cross;
        else if (start !== null) {
          parts.push(`M${start.toFixed(1)},${y}H${cross.toFixed(1)}V${y + 1}H${start.toFixed(1)}Z`);
          start = null;
        }
      }
      previous = value;
    }
    if (start !== null) {
      parts.push(`M${start.toFixed(1)},${y}H${width.toFixed(1)}V${y + 1}H${start.toFixed(1)}Z`);
    }
  }
  return parts.join('');
}

const parseColor = (value: string): number[] => {
  const hexMatch = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (hexMatch) {
    const raw = hexMatch[1];
    const hex = raw.length === 3 ? raw.replace(/./g, (d) => d + d) : raw;
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255,
      1,
    ];
  }
  const rgbMatch = /rgba?\(([^)]+)\)/i.exec(value);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((p) => parseFloat(p));
    return [parts[0] / 255, parts[1] / 255, parts[2] / 255, parts[3] ?? 1];
  }
  return [0.84, 0.1, 0.125, 1];
};

const UNIFORMS = [
  'uSize',
  'uRatio',
  'uPills',
  'uHover',
  'uDrops',
  'uTails',
  'uTints',
  'uCount',
  'uSmooth',
  'uPill',
  'uHoverColor',
  'uShadow',
] as const;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function buildPipeline(gl: WebGL2RenderingContext): Pipeline | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  const uniforms = Object.fromEntries(UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]));
  const buffer = gl.createBuffer();
  if (!buffer) {
    gl.deleteProgram(program);
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  return { program, uniforms, buffer, position: gl.getAttribLocation(program, 'aPosition') };
}

/**
 * React Bits WebGL2 Gooey Nav adapted with Next.js Links, ROG Crimson dual-theme palette,
 * and semantic <div> markup (zero <ul>/<li> elements). Width hugs content naturally.
 */
export function GooeyNav({
  items,
  activeHref,
  size = 'md',
  animationTime = 560,
  particleCount = 14,
  gooeyness = 0.55,
  wobble = 0.55,
  className = '',
}: GooeyNavProps) {
  const theme = useThemeMode();
  const matchedIndex = items.findIndex((item) =>
    item.href === '/'
      ? activeHref === '/'
      : activeHref === item.href || activeHref.startsWith(`${item.href}/`),
  );
  const [optimistic, setOptimistic] = useState<{ href: string; idx: number } | null>(null);
  const current = optimistic?.href === activeHref ? optimistic.idx : matchedIndex;

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLSpanElement>(null);
  const engineRef = useRef<{ go: (index: number) => void; refresh: () => void } | null>(null);

  const indexRef = useRef(current);
  const isDark = theme === 'dark';
  const pillColor = '#D71920';
  const settings = {
    animationTime,
    particleCount,
    timeVariance: 240,
    spread: 44,
    gooeyness,
    wobble,
    hoverEffect: true,
    pillRgb: parseColor(pillColor),
    tints: ['#D71920', '#FF4D58', '#F59E0B'].map(parseColor),
    hoverRgb: isDark ? [1, 1, 1, 0.08] : [0.06, 0.08, 0.12, 0.07],
    shadow: isDark ? 0.35 : 0.16,
  };
  const settingsRef = useRef(settings);

  useEffect(() => {
    indexRef.current = current;
  }, [current]);

  useEffect(() => {
    settingsRef.current = settings;
    engineRef.current?.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pillColor, isDark, animationTime, particleCount, gooeyness, wobble, size]);

  useIsomorphicLayoutEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const list = listRef.current;
    const overlay = overlayRef.current;
    const fallback = fallbackRef.current;
    if (!stage || !canvas || !list || !overlay || !fallback) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    });
    const pipeline = gl ? buildPipeline(gl) : null;
    fallback.style.display = pipeline ? 'none' : 'block';
    canvas.style.display = pipeline ? 'block' : 'none';

    const view = { width: 0, height: 0 };
    let rects: Rect[] = [];
    let target = -1;
    const pills = new Map<number, PillState>();
    const drops: Drop[] = [];
    const hover = { x: 0, y: 0, w: 0, h: 0, alpha: 0, index: -1 };
    const pillData = new Float32Array(MAX_PILLS * 4);
    const dropData = new Float32Array(MAX_DROPS * 4);
    const tailData = new Float32Array(MAX_DROPS * 2);
    const tintData = new Float32Array(MAX_DROPS * 3);
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
      const s = settingsRef.current;
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
      const s = settingsRef.current;
      const source = pills.get(from);
      const rect = rects[from];
      if (!source || !rect || !rects[to]) return;
      const available = source.mass - source.outgoing;
      if (available <= 0.002) return;
      const room = MAX_DROPS - drops.length;
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
      const s = settingsRef.current;
      const activeBox = target >= 0 ? shape(target, 1) : null;
      const height = rects[target]?.h ?? rects[0]?.h ?? 34;
      const smooth = height * (0.18 + 0.5 * clamp01(s.gooeyness));
      const boxes: Box[] = [];
      const blobs: Blob[] = [];
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
          ? traceOverlayPath(boxes, blobs, smooth, view.width, view.height)
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
        if (slot >= MAX_PILLS) break;
        pillData[slot * 4] = box.cx + MARGIN;
        pillData[slot * 4 + 1] = box.cy + MARGIN;
        pillData[slot * 4 + 2] = box.hw;
        pillData[slot * 4 + 3] = box.hh;
        slot += 1;
      }
      pillData.fill(0, slot * 4);

      let count = 0;
      for (const blob of blobs) {
        if (count >= MAX_DROPS) break;
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
      const s = settingsRef.current;
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
        // Animate entrance from "/" with an inward splash + spring settle onto the clicked nav item.
        const dest = rects[index];
        const s = settingsRef.current;
        const p = pill(index);
        p.mass = 0.25;
        p.scale = 0.25;
        p.velocity = 0;

        const burstCount = Math.min(MAX_DROPS - drops.length, Math.max(6, Math.round(s.particleCount * 0.6)));
        const win = Math.max(0.12, s.animationTime / 1000) * 0.14;
        for (let i = 0; i < burstCount; i += 1) {
          const angle = (Math.PI * 2 * i) / Math.max(1, burstCount) + (Math.random() - 0.5) * 0.4;
          const dist = Math.max(18, s.spread * 0.72);
          const drop: Drop = {
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
          };
          drops.push(drop);
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
    settle(indexRef.current);
    document.fonts?.ready.then(() => {
      if (disposed) return;
      measure();
      if (!drops.length) settle(target);
    });

    engineRef.current = {
      go: (idx) => go(idx, true),
      refresh: () => {
        render();
        wake();
      },
    };

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      list.removeEventListener('pointerover', onOver);
      list.removeEventListener('pointerleave', onLeave);
      if (gl && pipeline) {
        gl.deleteBuffer(pipeline.buffer);
        gl.deleteProgram(pipeline.program);
      }
      engineRef.current = null;
    };
  }, [items.length]);

  useEffect(() => {
    engineRef.current?.go(current);
  }, [current]);

  const itemPad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <div
      style={
        {
          '--gn-frame': isDark ? 'rgba(20, 22, 28, 0.92)' : 'rgba(226, 232, 240, 0.9)',
          '--gn-edge': isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.16)',
        } as CSSProperties
      }
      className={`relative inline-flex w-fit max-w-full rounded-full border border-[var(--gn-edge)] bg-[var(--gn-frame)] p-1 backdrop-blur-md ${className}`}
    >
      <div ref={stageRef} className="relative max-w-full">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 z-0"
        />
        <span
          ref={fallbackRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 z-0 hidden rounded-full bg-primary transition-[transform,width,opacity] duration-200"
        />

        <div ref={listRef} role="list" className="relative z-10 flex flex-wrap items-center gap-0.5">
          {items.map((item, idx) => {
            const isActive = idx === current;
            return (
              <div
                key={item.href}
                role="listitem"
                data-gooey-index={idx}
                data-active={isActive ? '' : undefined}
                className="flex"
              >
                <Link
                  href={item.href}
                  data-testid={item.testId}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setOptimistic({ href: activeHref, idx })}
                  className={`inline-flex items-center whitespace-nowrap rounded-full font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-signal ${itemPad} ${
                    isActive ? 'text-primary-fg' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              </div>
            );
          })}
        </div>

        <div
          ref={overlayRef}
          aria-hidden="true"
          className="pointer-events-none invisible absolute inset-0 z-20 flex flex-wrap items-center gap-0.5 text-primary-fg [clip-path:inset(100%)]"
        >
          {items.map((item) => (
            <div key={item.href} className="flex">
              <span
                className={`inline-flex items-center whitespace-nowrap rounded-full font-semibold ${itemPad}`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
