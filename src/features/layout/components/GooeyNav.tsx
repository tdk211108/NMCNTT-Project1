'use client';

import { Menu } from '@base-ui/react/menu';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useIsomorphicLayoutEffect } from '@/lib/client-hooks';
import {
  createGooeyNavEngine,
  parseGooeyColor,
  type GooeyNavEngineHandle,
} from '../gooey-nav-engine';
import { useThemeMode } from '../useThemeMode';

export interface GooeyNavSubItem {
  href: string;
  label: string;
  description: string;
  testId?: string;
}

export interface GooeyNavItem {
  href: string;
  label: string;
  testId?: string;
  menuTestId?: string;
  subItems?: readonly GooeyNavSubItem[];
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

/**
 * React Bits WebGL2 Gooey Nav adapted with Next.js Links, ROG Crimson dual-theme palette,
 * and semantic <div> markup (zero <ul>/<li> elements). Width hugs content naturally.
 */
function matchesGooeyItem(item: GooeyNavItem, activeHref: string): boolean {
  if (item.subItems?.length) {
    return item.subItems.some(
      (sub) => activeHref === sub.href || activeHref.startsWith(`${sub.href}/`),
    );
  }
  return item.href === '/'
    ? activeHref === '/'
    : activeHref === item.href || activeHref.startsWith(`${item.href}/`);
}

/** Renders the dropdown chevron so trigger and gooey overlay layers stay in lockstep. */
export function GooeyMenuChevron({ open }: { open: boolean }) {
  return (
    <ChevronDown
      aria-hidden="true"
      className={`h-3.5 w-3.5 shrink-0 motion-safe:transition-transform ${
        open ? 'rotate-180' : ''
      }`}
    />
  );
}

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
  const matchedIndex = items.findIndex((item) => matchesGooeyItem(item, activeHref));
  const [optimistic, setOptimistic] = useState<{ href: string; idx: number } | null>(null);
  const [openMenuHref, setOpenMenuHref] = useState<string | null>(null);
  const openMenuIndex = openMenuHref
    ? items.findIndex((item) => item.href === openMenuHref)
    : -1;
  const current =
    optimistic?.href === activeHref
      ? optimistic.idx
      : openMenuIndex >= 0
        ? openMenuIndex
        : matchedIndex;

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLSpanElement>(null);
  const engineRef = useRef<GooeyNavEngineHandle | null>(null);

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
    pillRgb: parseGooeyColor(pillColor),
    tints: ['#D71920', '#FF4D58', '#F59E0B'].map(parseGooeyColor),
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

    const engine = createGooeyNavEngine({
      stage,
      canvas,
      list,
      overlay,
      fallback,
      initialIndex: indexRef.current,
      getSettings: () => settingsRef.current,
    });
    engineRef.current = engine;

    return () => {
      engine.destroy();
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
            const menuOpen = openMenuHref === item.href;

            return (
              <div
                key={item.href}
                role="listitem"
                data-gooey-index={idx}
                data-active={isActive ? '' : undefined}
                className="flex"
              >
                {item.subItems?.length ? (
                  <Menu.Root
                    open={menuOpen}
                    onOpenChange={(nextOpen) => setOpenMenuHref(nextOpen ? item.href : null)}
                  >
                    <Menu.Trigger
                      data-testid={item.testId}
                      data-sfx="toggle"
                      className={`inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-signal ${itemPad} ${
                        isActive ? 'text-primary-fg' : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      <span>{item.label}</span>
                      <GooeyMenuChevron open={menuOpen} />
                    </Menu.Trigger>

                    <Menu.Portal>
                      <Menu.Positioner
                        side="bottom"
                        sideOffset={8}
                        align="start"
                        collisionPadding={12}
                        className="z-50"
                      >
                        <Menu.Popup
                          data-testid={item.menuTestId}
                          data-no-grid-cascade=""
                          className="mtx-shadow w-72 max-w-[calc(100vw-1.5rem)] rounded-card border-2 border-border-strong bg-surface-elevated p-1.5 text-ink outline-none transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] data-[starting-style]:-translate-y-1 data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 data-[ending-style]:-translate-y-1 data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 motion-reduce:transition-none"
                        >
                          {item.subItems.map((sub) => {
                            const subActive =
                              activeHref === sub.href || activeHref.startsWith(`${sub.href}/`);
                            return (
                              <Menu.LinkItem
                                key={sub.href}
                                closeOnClick
                                data-testid={sub.testId}
                                data-sfx="click"
                                onClick={() => setOptimistic({ href: activeHref, idx })}
                                render={<Link href={sub.href} />}
                                className={`flex flex-col gap-0.5 rounded-control border-2 px-3 py-2 text-left transition-colors outline-none data-[highlighted]:border-signal data-[highlighted]:bg-surface-subtle ${
                                  subActive
                                    ? 'border-primary bg-highlight text-highlight-fg'
                                    : 'border-transparent text-ink hover:bg-surface-subtle'
                                }`}
                              >
                                <span className="text-sm font-semibold">{sub.label}</span>
                                <span
                                  className={`text-xs ${
                                    subActive ? 'text-highlight-fg/90' : 'text-ink-muted'
                                  }`}
                                >
                                  {sub.description}
                                </span>
                              </Menu.LinkItem>
                            );
                          })}
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.Root>
                ) : (
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
                )}
              </div>
            );
          })}
        </div>

        <div
          ref={overlayRef}
          aria-hidden="true"
          className="pointer-events-none invisible absolute inset-0 z-20 flex flex-wrap items-center gap-0.5 text-primary-fg [clip-path:inset(100%)]"
        >
          {items.map((item) => {
            const menuOpen = openMenuHref === item.href;

            return (
              <div key={item.href} className="flex">
                <span
                  className={`inline-flex items-center whitespace-nowrap rounded-full font-semibold ${
                    item.subItems?.length ? 'gap-1' : ''
                  } ${itemPad}`}
                >
                  <span>{item.label}</span>
                  {item.subItems?.length ? <GooeyMenuChevron open={menuOpen} /> : null}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
