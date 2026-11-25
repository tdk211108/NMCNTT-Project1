'use client';

import { useEffect, useRef } from 'react';
import { useIsomorphicLayoutEffect } from '@/lib/client-hooks';

export const DEFAULT_IGNORE_CASCADE_SELECTOR =
  'header, nav, footer, [data-testid="header-floating-nav"], dialog, [role="dialog"], [role="listbox"], [data-no-grid-cascade]';

export interface ShapeGridProps {
  cellSize?: number;
  lineWidth?: number;
  direction?: 'diagonal' | 'up' | 'down' | 'left' | 'right' | 'none';
  speed?: number;
  lineColor?: string;
  hoverColor?: string;
  hoverFillColor?: string;
  fillOpacity?: number;
  radius?: number;
  trail?: number;
  glow?: number;
  clickCascade?: boolean;
  ignoreCascadeSelector?: string;
  className?: string;
}

interface Settings {
  cellSize: number;
  lineWidth: number;
  direction: string;
  speed: number;
  lineColor: string;
  hoverColor: string;
  hoverFillColor: string;
  fillOpacity: number;
  radius: number;
  trail: number;
  glow: number;
  clickCascade: boolean;
  ignoreCascadeSelector: string;
}

interface Cascade {
  x: number;
  y: number;
  time: number;
  power: number;
  reach: number;
}

interface Engine {
  redraw: () => void;
}

const DIRECTIONS: Record<string, readonly [number, number]> = {
  right: [1, 0],
  left: [-1, 0],
  up: [0, -1],
  down: [0, 1],
  diagonal: [Math.SQRT1_2, -Math.SQRT1_2],
  none: [0, 0],
};

const OFFSET = 32768;
const MAX_PIXELS = 8e6;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};
const keyOf = (i: number, j: number) => (i + OFFSET) * 65536 + (j + OFFSET);

/** Interactive drifting square drafting grid rendered on HTML5 Canvas. */
export function ShapeGrid({
  cellSize = 44,
  lineWidth = 1,
  direction = 'diagonal',
  speed = 0.35,
  lineColor = 'rgba(142, 147, 155, 0.14)',
  hoverColor = '#FF1E2D',
  hoverFillColor,
  fillOpacity = 0.22,
  radius = 1.6,
  trail = 0.55,
  glow = 0.35,
  clickCascade = true,
  ignoreCascadeSelector = DEFAULT_IGNORE_CASCADE_SELECTOR,
  className = '',
}: ShapeGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);

  const nextSettings: Settings = {
    cellSize: Math.max(12, cellSize),
    lineWidth: Math.max(0.25, lineWidth),
    direction: DIRECTIONS[direction] ? direction : 'diagonal',
    speed: Math.max(0, speed),
    lineColor,
    hoverColor,
    hoverFillColor: hoverFillColor ?? hoverColor,
    fillOpacity: clamp(fillOpacity, 0, 1),
    radius: Math.max(0, radius),
    trail: Math.max(0.05, trail),
    glow: clamp(glow, 0, 1),
    clickCascade,
    ignoreCascadeSelector,
  };
  const settingsRef = useRef<Settings>(nextSettings);

  useIsomorphicLayoutEffect(() => {
    settingsRef.current = {
      cellSize: Math.max(12, cellSize),
      lineWidth: Math.max(0.25, lineWidth),
      direction: DIRECTIONS[direction] ? direction : 'diagonal',
      speed: Math.max(0, speed),
      lineColor,
      hoverColor,
      hoverFillColor: hoverFillColor ?? hoverColor,
      fillOpacity: clamp(fillOpacity, 0, 1),
      radius: Math.max(0, radius),
      trail: Math.max(0.05, trail),
      glow: clamp(glow, 0, 1),
      clickCascade,
      ignoreCascadeSelector,
    };
    engineRef.current?.redraw();
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const reduceMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reducedMotion = reduceMotionQuery?.matches ?? false;

    const state = {
      alive: true,
      raf: 0,
      last: 0,
      time: 0,
      visible: true,
      tabActive: !document.hidden,
      skippedByCv: false,
      width: 1,
      height: 1,
      ratio: 1,
      offsetX: 0,
      offsetY: 0,
      inside: false,
      pointerX: 0,
      pointerY: 0,
      spotX: 0,
      spotY: 0,
      spotVX: 0,
      spotVY: 0,
      spotPower: 0,
      lit: new Map<number, number>(),
      cascades: [] as Cascade[],
    };

    const canRunLoop = () => state.alive && state.visible && state.tabActive && !state.skippedByCv;

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      let ratio = Math.min(window.devicePixelRatio || 1, 2);
      const pixels = width * height * ratio * ratio;
      if (pixels > MAX_PIXELS) ratio *= Math.sqrt(MAX_PIXELS / pixels);
      state.width = width;
      state.height = height;
      state.ratio = ratio;

      const pixelWidth = Math.max(1, Math.round(width * ratio));
      const pixelHeight = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      const cssWidth = `${width}px`;
      const cssHeight = `${height}px`;
      if (canvas.style.width !== cssWidth) canvas.style.width = cssWidth;
      if (canvas.style.height !== cssHeight) canvas.style.height = cssHeight;
    };

    const illuminate = (s: Settings, dt: number) => {
      const decay = Math.exp(-dt / s.trail);
      for (const [key, value] of state.lit) {
        const next = value * decay;
        if (next < 0.004) state.lit.delete(key);
        else state.lit.set(key, next);
      }

      if (state.spotPower < 0.01) return;
      const size = s.cellSize;
      const wx = state.spotX + state.offsetX;
      const wy = state.spotY + state.offsetY;
      const reach = Math.max(s.radius, 0.5) * size;
      const hi = Math.floor(wx / size);
      const hj = Math.floor(wy / size);
      const span = Math.ceil(reach / size) + 1;

      for (let i = hi - span; i <= hi + span; i++) {
        for (let j = hj - span; j <= hj + span; j++) {
          const cx = (i + 0.5) * size;
          const cy = (j + 0.5) * size;
          const distance = Math.hypot(cx - wx, cy - wy);
          let value = s.radius > 0 ? smoothstep(reach, reach * 0.15, distance) : 0;
          if (i === hi && j === hj) value = Math.max(value, 1);
          value *= state.spotPower;
          if (value <= 0.004) continue;
          const key = keyOf(i, j);
          if (value > (state.lit.get(key) ?? 0)) {
            state.lit.set(key, value);
          }
        }
      }
    };

    const cascadeAt = (s: Settings, cx: number, cy: number): number => {
      let peak = 0;
      for (const cascade of state.cascades) {
        const ring = Math.round(Math.hypot(cx - cascade.x, cy - cascade.y) / s.cellSize);
        const local = state.time - cascade.time - ring * 0.055;
        if (local < 0) continue;
        const pulse =
          Math.exp(-((local / 0.085) ** 2)) *
          cascade.power *
          Math.max(0, 1 - ring / cascade.reach);
        if (pulse > peak) peak = pulse;
      }
      return peak;
    };

    const draw = () => {
      const s = settingsRef.current;
      const size = s.cellSize;
      const { width, height, ratio } = state;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const i0 = Math.floor(state.offsetX / size) - 1;
      const i1 = Math.ceil((state.offsetX + width) / size) + 1;
      const j0 = Math.floor(state.offsetY / size) - 1;
      const j1 = Math.ceil((state.offsetY + height) / size) + 1;

      ctx.lineWidth = s.lineWidth;
      ctx.lineJoin = 'miter';
      ctx.strokeStyle = s.lineColor;
      ctx.beginPath();
      for (let i = i0; i <= i1; i++) {
        const x = i * size - state.offsetX;
        ctx.moveTo(x, -size);
        ctx.lineTo(x, height + size);
      }
      for (let j = j0; j <= j1; j++) {
        const y = j * size - state.offsetY;
        ctx.moveTo(-size, y);
        ctx.lineTo(width + size, y);
      }
      ctx.stroke();

      if (reducedMotion) return;

      const glowing = s.glow > 0;
      const inset = s.lineWidth * 0.5;
      const cellSpan = size - inset * 2;

      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          const cx = (i + 0.5) * size;
          const cy = (j + 0.5) * size;
          let value = state.lit.get(keyOf(i, j)) ?? 0;
          if (state.cascades.length) {
            const pulse = cascadeAt(s, cx, cy);
            if (pulse > value) value = pulse;
          }
          if (value <= 0.01) continue;

          const x = i * size - state.offsetX + inset;
          const y = j * size - state.offsetY + inset;

          if (s.fillOpacity > 0) {
            ctx.globalAlpha = Math.min(1, value) * s.fillOpacity;
            ctx.fillStyle = s.hoverFillColor;
            ctx.fillRect(x, y, cellSpan, cellSpan);
          }

          ctx.globalAlpha = Math.min(1, value) * 0.9;
          if (glowing) {
            ctx.shadowColor = s.hoverColor;
            ctx.shadowBlur = s.glow * 14 * value;
          }
          ctx.strokeStyle = s.hoverColor;
          ctx.lineWidth = s.lineWidth * (1 + value * 0.45);
          ctx.strokeRect(x, y, cellSpan, cellSpan);
          ctx.shadowBlur = 0;
        }
      }
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      state.raf = 0;
      if (!canRunLoop()) {
        state.last = 0;
        return;
      }

      const s = settingsRef.current;
      const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
      state.last = now;

      if (!reducedMotion) {
        state.time += dt;
        const [dx, dy] = DIRECTIONS[s.direction] ?? DIRECTIONS.diagonal;
        state.offsetX -= dx * s.speed * 60 * dt;
        state.offsetY -= dy * s.speed * 60 * dt;

        const want = state.inside ? 1 : 0;
        state.spotPower += (want - state.spotPower) * (1 - Math.exp(-(want ? 10 : 5) * dt));
        const stiffness = 220;
        const damping = 2 * Math.sqrt(stiffness) * 0.85;
        state.spotVX += (stiffness * (state.pointerX - state.spotX) - damping * state.spotVX) * dt;
        state.spotVY += (stiffness * (state.pointerY - state.spotY) - damping * state.spotVY) * dt;
        state.spotX += state.spotVX * dt;
        state.spotY += state.spotVY * dt;

        illuminate(s, dt);
        state.cascades = state.cascades.filter(
          (c) => state.time - c.time < c.reach * 0.055 + 0.4,
        );
      }

      draw();

      const settled =
        reducedMotion ||
        ((s.speed === 0 || s.direction === 'none') &&
          state.lit.size === 0 &&
          state.cascades.length === 0 &&
          state.spotPower < 0.005);

      if (!settled && canRunLoop()) {
        state.raf = requestAnimationFrame(frame);
      } else {
        state.last = 0;
      }
    };

    const wake = () => {
      if (!state.raf && canRunLoop()) {
        state.raf = requestAnimationFrame(frame);
      }
    };

    const pointFrom = (event: PointerEvent): readonly [number, number] | null => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
      return [x, y];
    };

    const isIgnoredTarget = (target: EventTarget | null, selector: string): boolean => {
      if (!selector || !(target instanceof Element)) return false;
      return Boolean(target.closest(selector));
    };

    const onMove = (event: PointerEvent) => {
      if (reducedMotion) return;
      if (isIgnoredTarget(event.target, 'header, [data-testid="header-floating-nav"], dialog, [role="dialog"]')) {
        state.inside = false;
        return;
      }
      const point = pointFrom(event);
      if (point && !state.inside && state.spotPower < 0.02) {
        state.spotX = point[0];
        state.spotY = point[1];
        state.spotVX = 0;
        state.spotVY = 0;
      }
      state.inside = point !== null;
      if (point) {
        state.pointerX = point[0];
        state.pointerY = point[1];
        wake();
      }
    };

    const onLeave = () => {
      state.inside = false;
    };

    const onDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      if (reducedMotion || !s.clickCascade) return;
      if (isIgnoredTarget(event.target, s.ignoreCascadeSelector)) return;
      const point = pointFrom(event);
      if (!point) return;
      state.cascades.push({
        x: point[0] + state.offsetX,
        y: point[1] + state.offsetY,
        time: state.time,
        power: 1,
        reach: Math.hypot(state.width, state.height) / s.cellSize,
      });
      if (state.cascades.length > 6) state.cascades.shift();
      wake();
    };

    const onVisibility = () => {
      state.tabActive = !document.hidden;
      if (state.tabActive) {
        state.last = 0;
        wake();
      }
    };

    const onContentVisibility = (event: Event) => {
      state.skippedByCv = Boolean((event as ContentVisibilityAutoStateChangeEvent).skipped);
      if (!state.skippedByCv) {
        state.last = 0;
        wake();
      }
    };

    const onMotionPrefChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      draw();
      wake();
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
      wake();
    });
    resizeObserver.observe(container);

    const visibilityObserver = new IntersectionObserver((entries) => {
      state.visible = entries.some((entry) => entry.isIntersecting);
      if (state.visible) wake();
    });
    visibilityObserver.observe(container);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('blur', onLeave);
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    container.addEventListener('contentvisibilityautostatechange', onContentVisibility);
    reduceMotionQuery?.addEventListener('change', onMotionPrefChange);

    engineRef.current = {
      redraw: () => {
        resize();
        draw();
        wake();
      },
    };

    resize();
    draw();
    wake();

    return () => {
      state.alive = false;
      cancelAnimationFrame(state.raf);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('blur', onLeave);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      container.removeEventListener('contentvisibilityautostatechange', onContentVisibility);
      reduceMotionQuery?.removeEventListener('change', onMotionPrefChange);
      engineRef.current = null;
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative h-full w-full overflow-hidden ${className}`.trim()}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
