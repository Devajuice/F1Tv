import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

export type ThemePreference = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

const STORAGE_KEY = 'f1tv:theme';

/** Chrome/address-bar tint per theme. Matches the canvas gradient stops. */
const THEME_COLOR: Record<ResolvedTheme, string> = {
  dark: '#07080a',
  light: '#eef1f6',
};

interface ThemeContextValue {
  /** What the user picked. */
  preference: ThemePreference;
  /** What is actually rendered, after resolving `system`. */
  theme: ResolvedTheme;
  /** False when the user has never chosen and the OS is being followed. */
  isExplicit: boolean;
  setPreference: (value: ThemePreference) => void;
  /** Flip between light and dark, pinning the choice. */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Validate a value read back from storage; anything unknown falls back. */
function parse(raw: string | null): ThemePreference {
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
}

/**
 * A copy of the bootstrap script in `index.html`. The theme attribute has to be
 * on the document element before first paint, otherwise a light-theme reload
 * shows a dark flash — and that cannot be done from React, because the
 * provider only mounts once the bundle has parsed. Keep the two in step.
 */
export const THEME_BOOTSTRAP = `(function(){try{var p=localStorage.getItem('${STORAGE_KEY}');if(p!=='light'&&p!=='dark'){p=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=p;document.documentElement.style.colorScheme=p;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function readPreference(): ThemePreference {
  try {
    return parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return 'system';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const [system, setSystem] = useState<ResolvedTheme>(systemTheme);

  // Track the OS setting so `system` stays live rather than sampled once.
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (event: MediaQueryListEvent) =>
      setSystem(event.matches ? 'light' : 'dark');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const theme: ResolvedTheme = preference === 'system' ? system : preference;

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.theme !== theme) root.dataset.theme = theme;
    // Keep UA-rendered surfaces (form controls, scrollbars, the canvas
    // background) in step with the tokens.
    root.style.colorScheme = theme;
    // Tints the mobile address bar and the installed-PWA title bar.
    document
      .querySelector('meta[data-theme-color]')
      ?.setAttribute('content', THEME_COLOR[theme]);
  }, [theme]);

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value);
    try {
      if (value === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* private mode: the choice still applies for this session */
    }
  }, []);

  const toggle = useCallback(() => {
    // Resolve against what is on screen right now, so the first click from
    // `system` lands on the opposite of the visible theme.
    setPreference(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
  }, [setPreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      theme,
      isExplicit: preference !== 'system',
      setPreference,
      toggle,
    }),
    [preference, theme, setPreference, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}