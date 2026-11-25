'use client';

import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { prefersReducedMotionNow, useIsomorphicLayoutEffect } from '@/lib/client-hooks';

const FADE_FLOOR = 0.16;
const FADE_PEAK = 0.62;
const FADE_LEAD = 6;
const SETTLE =
  'color 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1)';

export interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center' | 'random';
  useOriginalCharsOnly?: boolean;
  animateOn?: 'mount' | 'view' | 'hover' | 'inViewHover' | 'click';
  effect?: 'scramble' | 'fade' | 'flip';
  loop?: boolean;
  loopDelay?: number;
  characters?: string;
  className?: string;
  encryptedClassName?: string;
  scrambleColor?: string;
  hoverRadius?: number;
}

interface Frame {
  shown: string[];
  revealed: boolean[];
  tint: number[];
  dim: number[];
  squeeze: number[];
}

interface FontMetrics {
  font: string;
  spacing: number;
}

type Point = { x: number; y: number };
type Group = string | { key: number; letters: number[] };

const glyphWidths = new Map<string, Map<string, number>>();
let measureContext: CanvasRenderingContext2D | null = null;

function isSpace(char: string): boolean {
  return /\s/.test(char);
}

function readFont(node: Element): FontMetrics {
  const style = window.getComputedStyle(node);
  return {
    font: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    spacing: parseFloat(style.letterSpacing) || 0,
  };
}

function advance(font: string, glyph: string): number {
  let widths = glyphWidths.get(font);
  if (!widths) {
    widths = new Map<string, number>();
    glyphWidths.set(font, widths);
  }
  let width = widths.get(glyph);
  if (width === undefined) {
    measureContext = measureContext || document.createElement('canvas').getContext('2d');
    if (!measureContext) return 0;
    measureContext.font = font;
    width = measureContext.measureText(glyph).width;
    widths.set(glyph, width);
  }
  return width;
}

function buildRevealOrder(
  chars: readonly string[],
  revealDirection: 'start' | 'end' | 'center' | 'random',
): number[] {
  const order = chars.map((c, idx) => (isSpace(c) ? -1 : idx)).filter((idx) => idx >= 0);
  if (revealDirection === 'end') return order.reverse();
  if (revealDirection === 'center') {
    const mid = Math.floor(chars.length / 2);
    return order.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
  }
  if (revealDirection === 'random') {
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }
  return order;
}

/**
 * React Bits DecryptedText with synchronous pre-paint mask initialization (zero SSR flash),
 * Canvas glyph-advance stabilization, sequential fade/scramble sweep, ROG Crimson tinting,
 * IntersectionObserver view trigger, and local pointer `hoverRadius` decryption ripples.
 */
export function DecryptedText({
  text,
  speed = 50,
  maxIterations = 12,
  sequential = true,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  animateOn = 'view',
  effect = 'fade',
  loop = false,
  loopDelay = 2000,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/_#%',
  className = '',
  encryptedClassName = 'text-accent-ink',
  scrambleColor = '#D71920',
  hoverRadius = 56,
}: DecryptedTextProps) {
  const chars = useMemo(() => Array.from(String(text ?? '')), [text]);
  const pool = useMemo(() => {
    const letters = chars.filter((c) => !isSpace(c));
    const source = useOriginalCharsOnly ? Array.from(new Set(letters)) : Array.from(characters);
    return source.length > 0 ? source : letters;
  }, [chars, characters, useOriginalCharsOnly]);
  const step = Math.max(16, speed);

  const [frame, setFrame] = useState<Frame>(() => ({
    shown: chars,
    revealed: chars.map(() => true),
    tint: chars.map(() => 0),
    dim: chars.map(() => 1),
    squeeze: chars.map(() => 1),
  }));

  const containerRef = useRef<HTMLSpanElement>(null);
  const cellsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const centersRef = useRef<(Point | null)[]>([]);
  const maskRef = useRef<boolean[]>(chars.map(() => true));
  const heatRef = useRef<number[]>(chars.map(() => 0));
  const pointerRef = useRef<Point | null>(null);
  const queueRef = useRef<number[] | null>(null);
  const timerRef = useRef<number | null>(null);
  const loopTimerRef = useRef<number | null>(null);
  const fontRef = useRef<FontMetrics | null>(null);
  const playedRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    const node = containerRef.current;
    if (!node || typeof window === 'undefined') return undefined;
    if (prefersReducedMotionNow()) return undefined;

    const startsHidden = animateOn === 'mount' || animateOn === 'view' || animateOn === 'inViewHover' || animateOn === 'click';
    const hoverable = animateOn === 'hover' || animateOn === 'inViewHover' || hoverRadius > 0;
    const isFading = effect === 'fade';

    const fit = (index: number, glyph: string): number => {
      if (!fontRef.current) fontRef.current = readFont(node);
      const metrics = fontRef.current;
      const room = advance(metrics.font, chars[index] ?? glyph) + metrics.spacing;
      const need = advance(metrics.font, glyph) + metrics.spacing;
      return need > room + 0.01 ? Math.round(Math.max(0.05, room / need) * 1000) / 1000 : 1;
    };

    const paint = (iter: number) => {
      const mask = maskRef.current;
      const heat = heatRef.current;
      const queue = queueRef.current;
      const ranks = queue ? new Map(queue.map((idx, rank) => [idx, rank])) : null;
      const ramp = Math.min(1, iter / Math.max(1, maxIterations));
      const next: Frame = { shown: [], revealed: [], tint: [], dim: [], squeeze: [] };

      chars.forEach((char, idx) => {
        const blank = isSpace(char);
        const hot = blank ? 0 : heat[idx] || 0;
        const hidden = !blank && !mask[idx];
        const scrambled = hidden || (hot > 0 && Math.random() < hot * 2);
        const glyph = scrambled ? (pool[Math.floor(Math.random() * pool.length)] ?? char) : char;
        next.revealed.push(!scrambled);
        next.shown.push(glyph);
        next.squeeze.push(scrambled ? fit(idx, glyph) : 1);

        if (!scrambled) {
          next.tint.push(0);
          next.dim.push(1);
        } else if (!hidden) {
          const level = Math.min(1, hot * 1.5);
          next.tint.push(level);
          next.dim.push(isFading ? 1 - (1 - FADE_FLOOR) * level : 1);
        } else {
          const rank = ranks?.get(idx);
          const lift = rank === undefined ? ramp : Math.max(0, 1 - rank / FADE_LEAD);
          next.tint.push(1);
          next.dim.push(isFading ? FADE_FLOOR + (FADE_PEAK - FADE_FLOOR) * lift : 1);
        }
      });

      setFrame(next);
    };

    const stopTicker = () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    const measure = () => {
      const box = node.getBoundingClientRect();
      centersRef.current = chars.map((char, idx) => {
        const cell = cellsRef.current[idx];
        if (isSpace(char) || !cell) return null;
        const rect = cell.getBoundingClientRect();
        return { x: rect.left - box.left + rect.width / 2, y: rect.top - box.top + rect.height / 2 };
      });
    };

    let iter = 0;

    const warm = (): boolean => {
      const heat = heatRef.current;
      const pointer = pointerRef.current;
      const box = pointer ? node.getBoundingClientRect() : null;
      const cool = 1 / Math.max(1, maxIterations);
      let active = false;

      chars.forEach((char, idx) => {
        if (isSpace(char)) return;
        let target = 0;
        const center = centersRef.current[idx];
        if (box && center && pointer) {
          const d =
            Math.hypot(box.left + center.x - pointer.x, box.top + center.y - pointer.y) /
            Math.max(1, hoverRadius);
          if (d < 1) target = 1 - d * d * (3 - 2 * d);
        }
        const val = Math.max((heat[idx] || 0) - cool, target);
        heat[idx] = val > 0.001 ? val : 0;
        if (heat[idx] > 0) active = true;
      });
      return active;
    };

    const startReveal = () => {
      iter = 0;
      maskRef.current = chars.map((c) => isSpace(c));
      queueRef.current = buildRevealOrder(chars, revealDirection);
      paint(0);
      if (timerRef.current === null) {
        timerRef.current = window.setInterval(tick, step);
      }
    };

    const tick = () => {
      iter += 1;
      if (queueRef.current) {
        if (sequential && queueRef.current.length > 0) {
          const idx = queueRef.current.shift();
          if (idx !== undefined) {
            maskRef.current = maskRef.current.slice();
            maskRef.current[idx] = true;
          }
          if (queueRef.current.length === 0) {
            queueRef.current = null;
          }
        } else if (!sequential && iter >= maxIterations) {
          maskRef.current = chars.map(() => true);
          queueRef.current = null;
        }
      }

      const warmActive = hoverRadius > 0 ? warm() : false;
      paint(iter);

      if (!queueRef.current && !warmActive) {
        stopTicker();
        if (loop) {
          if (loopTimerRef.current !== null) window.clearTimeout(loopTimerRef.current);
          loopTimerRef.current = window.setTimeout(() => {
            startReveal();
          }, Math.max(200, loopDelay));
        }
      }
    };

    if (startsHidden) {
      maskRef.current = chars.map((c) => isSpace(c));
      paint(0);
    }

    let observer: IntersectionObserver | null = null;
    if (animateOn === 'view' || animateOn === 'inViewHover') {
      if (typeof IntersectionObserver !== 'undefined') {
        observer = new IntersectionObserver(
          (entries) => {
            if (!playedRef.current && entries.some((entry) => entry.isIntersecting)) {
              playedRef.current = true;
              measure();
              startReveal();
              observer?.disconnect();
            }
          },
          { threshold: 0.1 },
        );
        observer.observe(node);
      } else {
        playedRef.current = true;
        measure();
        startReveal();
      }
    } else if (animateOn === 'mount') {
      playedRef.current = true;
      measure();
      startReveal();
    }

    const onMove = (e: MouseEvent) => {
      if (!hoverable || hoverRadius <= 0) return;
      if (!pointerRef.current) measure();
      pointerRef.current = { x: e.clientX, y: e.clientY };
      if (timerRef.current === null) {
        timerRef.current = window.setInterval(tick, step);
      }
    };

    const onLeave = () => {
      pointerRef.current = null;
    };

    const onClick = () => {
      if (animateOn !== 'click') return;
      measure();
      startReveal();
    };

    node.addEventListener('mousemove', onMove);
    node.addEventListener('mouseleave', onLeave);
    if (animateOn === 'click') {
      node.addEventListener('click', onClick);
    }

    return () => {
      observer?.disconnect();
      if (loopTimerRef.current !== null) window.clearTimeout(loopTimerRef.current);
      stopTicker();
      node.removeEventListener('mousemove', onMove);
      node.removeEventListener('mouseleave', onLeave);
      node.removeEventListener('click', onClick);
    };
  }, [
    chars,
    pool,
    step,
    maxIterations,
    sequential,
    revealDirection,
    animateOn,
    effect,
    loop,
    loopDelay,
    hoverRadius,
  ]);

  useIsomorphicLayoutEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      fontRef.current = readFont(node);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const groups = useMemo(() => {
    const result: Group[] = [];
    let word: { key: number; letters: number[] } | null = null;
    chars.forEach((char, idx) => {
      if (isSpace(char)) {
        result.push(char);
        word = null;
        return;
      }
      if (!word) {
        word = { key: idx, letters: [] };
        result.push(word);
      }
      word.letters.push(idx);
    });
    return result;
  }, [chars]);

  return (
    <span
      ref={containerRef}
      aria-label={text}
      className={`inline-block whitespace-pre-wrap ${className}`}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {groups.map((group) =>
          typeof group === 'string' ? (
            group
          ) : (
            <span key={group.key} className="whitespace-nowrap">
              {group.letters.map((idx) => {
                const char = chars[idx];
                const revealed = frame.revealed[idx] ?? true;
                const squeeze = frame.squeeze[idx] ?? 1;
                const style: CSSProperties = {
                  transition: revealed ? SETTLE : `color 0.12s linear, opacity ${step}ms linear`,
                  opacity: revealed ? 1 : (frame.dim[idx] ?? FADE_FLOOR),
                };
                if (scrambleColor && !revealed) {
                  const pct = Math.round((frame.tint[idx] ?? 1) * 100);
                  style.color =
                    pct >= 100
                      ? scrambleColor
                      : `color-mix(in srgb, ${scrambleColor} ${pct}%, currentColor)`;
                }

                return (
                  <span
                    key={idx}
                    ref={(el) => {
                      cellsRef.current[idx] = el;
                    }}
                    className={revealed ? 'inline-block' : `relative inline-block ${encryptedClassName}`}
                    style={style}
                  >
                    {revealed ? (
                      char
                    ) : (
                      <>
                        <span className="invisible">{char}</span>
                        <span
                          className="absolute top-0 left-1/2 -translate-x-1/2"
                          style={squeeze < 1 ? { transform: `scaleX(${squeeze})` } : undefined}
                        >
                          {frame.shown[idx] ?? char}
                        </span>
                      </>
                    )}
                  </span>
                );
              })}
            </span>
          ),
        )}
      </span>
    </span>
  );
}
