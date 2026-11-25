'use client';

import { ShapeGrid } from './ShapeGrid';
import { type ThemeMode } from '@/lib/theme';
import { TEST_IDS } from '@/shared/testids';
import { useThemeMode } from '../useThemeMode';

const GRID_THEME_CONFIG: Record<
  ThemeMode,
  {
    lineColor: string;
    hoverColor: string;
    hoverFillColor: string;
    fillOpacity: number;
    glow: number;
  }
> = {
  dark: {
    lineColor: 'rgba(142, 147, 155, 0.14)',
    hoverColor: '#FF1E2D',
    hoverFillColor: 'rgba(200, 16, 46, 0.22)',
    fillOpacity: 0.24,
    glow: 0.35,
  },
  light: {
    lineColor: 'rgba(17, 18, 21, 0.11)',
    hoverColor: '#C8102E',
    hoverFillColor: 'rgba(200, 16, 46, 0.14)',
    fillOpacity: 0.2,
    glow: 0.18,
  },
};

/** Persistent full-viewport interactive square grid synced to active Dark/Light palette. */
export function InteractiveBackground() {
  const mode = useThemeMode();
  const palette = GRID_THEME_CONFIG[mode];

  return (
    <div
      aria-hidden="true"
      data-testid={TEST_IDS.layout.interactiveBg}
      data-theme-variant={mode}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <ShapeGrid
        cellSize={44}
        lineWidth={1}
        direction="diagonal"
        speed={0.35}
        radius={1.6}
        trail={0.55}
        clickCascade
        lineColor={palette.lineColor}
        hoverColor={palette.hoverColor}
        hoverFillColor={palette.hoverFillColor}
        fillOpacity={palette.fillOpacity}
        glow={palette.glow}
      />
    </div>
  );
}
