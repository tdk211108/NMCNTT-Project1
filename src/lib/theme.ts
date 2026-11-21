export type ThemeMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'coreraster-theme';
export const DEFAULT_THEME_MODE: ThemeMode = 'dark';
export const THEME_CHANGE_EVENT = 'coreraster-theme-change';

/** Parse persisted theme string strictly; falls back to dark mode. */
export function parseStoredTheme(value: unknown): ThemeMode {
  return value === 'light' ? 'light' : 'dark';
}

export function getThemeInitScript(): string {
  return `(function(){try{var v=localStorage.getItem('${THEME_STORAGE_KEY}');var m=v==='light'?'light':'${DEFAULT_THEME_MODE}';var meta=document.querySelector('meta[name="color-scheme"]');if(meta){meta.setAttribute('content',m);}document.documentElement.dataset.theme=m;}catch(_e){document.documentElement.dataset.theme='${DEFAULT_THEME_MODE}';}})();`;
}

export function readActiveTheme(
  doc: Document | undefined = typeof document !== 'undefined' ? document : undefined,
): ThemeMode {
  if (!doc) return DEFAULT_THEME_MODE;
  const metaContent = doc.querySelector('meta[name="color-scheme"]')?.getAttribute('content');
  if (metaContent === 'light' || metaContent === 'dark') {
    return metaContent;
  }
  const dataTheme = doc.documentElement.dataset.theme;
  return parseStoredTheme(dataTheme);
}

export function applyTheme(
  mode: ThemeMode,
  options?: { doc?: Document; storage?: Pick<Storage, 'setItem'> | null; persist?: boolean },
): void {
  const doc = options?.doc ?? (typeof document !== 'undefined' ? document : undefined);
  const storage =
    options?.storage !== undefined
      ? options.storage
      : typeof window !== 'undefined'
        ? window.localStorage
        : null;
  const persist = options?.persist ?? true;

  if (doc) {
    let meta = doc.querySelector('meta[name="color-scheme"]');
    if (!meta) {
      meta = doc.createElement('meta');
      meta.setAttribute('name', 'color-scheme');
      doc.head?.appendChild(meta);
    }
    meta.setAttribute('content', mode);
    doc.documentElement.dataset.theme = mode;
  }

  if (persist && storage) {
    try {
      storage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Ignore blocked storage in strict privacy contexts.
    }
  }
}

export function subscribeTheme(onStoreChange: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    applyTheme(parseStoredTheme(event.newValue), { persist: false });
    onStoreChange();
  };
  const handleLocalChange = () => onStoreChange();

  window.addEventListener('storage', handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, handleLocalChange);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, handleLocalChange);
  };
}

export function notifyThemeChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }
}

export function getThemeServerSnapshot(): ThemeMode {
  return DEFAULT_THEME_MODE;
}
