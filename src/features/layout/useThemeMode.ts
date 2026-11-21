'use client';

import { useSyncExternalStore } from 'react';
import {
  getThemeServerSnapshot,
  readActiveTheme,
  subscribeTheme,
  type ThemeMode,
} from '@/lib/theme';

/** Subscribe React components to synchronized dual-theme changes without FOUC. */
export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribeTheme, readActiveTheme, getThemeServerSnapshot);
}
