import type { PersistStorage, StorageValue } from 'zustand/middleware';
import type { z } from 'zod';

export interface SyncStateStorage {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
}

const memoryLocal = new Map<string, string>();
const memorySession = new Map<string, string>();

function readBrowserStorage(type: 'local' | 'session'): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const store = type === 'local' ? window.localStorage : window.sessionStorage;
    const probeKey = '__coreraster_probe__';
    store.setItem(probeKey, '1');
    store.removeItem(probeKey);
    return store;
  } catch {
    return null;
  }
}

function createSafeStateStorage(type: 'local' | 'session'): SyncStateStorage {
  const fallback = type === 'local' ? memoryLocal : memorySession;
  return {
    getItem(name: string): string | null {
      const store = readBrowserStorage(type);
      if (store) {
        try {
          return store.getItem(name);
        } catch {
          // Fall through to memory fallback if private mode throws mid-session.
        }
      }
      return fallback.get(name) ?? null;
    },
    setItem(name: string, value: string): void {
      fallback.set(name, value);
      const store = readBrowserStorage(type);
      if (store) {
        try {
          store.setItem(name, value);
        } catch {
          // Keep in-memory fallback when quota is exceeded.
        }
      }
    },
    removeItem(name: string): void {
      fallback.delete(name);
      const store = readBrowserStorage(type);
      if (store) {
        try {
          store.removeItem(name);
        } catch {
          // Ignore storage removal failures.
        }
      }
    },
  };
}

export const safeLocalStorage: SyncStateStorage = createSafeStateStorage('local');
export const safeSessionStorage: SyncStateStorage = createSafeStateStorage('session');

export function createValidatedLocalPersistStorage<TState>(
  schema: z.ZodType<TState>,
): PersistStorage<TState> {
  return {
    getItem(name: string): StorageValue<TState> | null {
      const raw = safeLocalStorage.getItem(name);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as { state?: unknown; version?: number };
        const validated = schema.safeParse(parsed?.state);
        if (!validated.success) {
          safeLocalStorage.removeItem(name);
          return null;
        }
        return {
          state: validated.data,
          version: typeof parsed.version === 'number' ? parsed.version : 1,
        };
      } catch {
        safeLocalStorage.removeItem(name);
        return null;
      }
    },
    setItem(name: string, value: StorageValue<TState>): void {
      safeLocalStorage.setItem(name, JSON.stringify(value));
    },
    removeItem(name: string): void {
      safeLocalStorage.removeItem(name);
    },
  };
}
