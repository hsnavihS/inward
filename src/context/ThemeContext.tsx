// react
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";

// types
import type { Mood } from "../types/Entry";

export type Theme = Mood;

const THEMES: Theme[] = ["noir", "blue", "crimson", "ember", "violet", "forest"];
const THEME_KEY = "inward-theme";

interface ThemeContext {
  theme: Theme;
  cycleTheme: () => void;
  setTemporaryTheme: (t: Theme) => void;
  restoreTheme: () => void;
}

const Ctx = createContext<ThemeContext | null>(null);

export function useTheme(): ThemeContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

function applyTheme(t: Theme) {
  if (t === "noir") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = t;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return THEMES.includes(saved as Theme) ? (saved as Theme) : "noir";
  });

  // Stack of temporary overrides so nested navigations work
  const savedThemeRef = useRef<Theme | null>(null);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const cycleTheme = () => {
    const idx = THEMES.indexOf(theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    savedThemeRef.current = null; // cycling clears override
    setTheme(next);
  };

  const setTemporaryTheme = useCallback((t: Theme) => {
    savedThemeRef.current = theme;
    applyTheme(t);
  }, [theme]);

  const restoreTheme = useCallback(() => {
    if (savedThemeRef.current !== null) {
      applyTheme(savedThemeRef.current);
      savedThemeRef.current = null;
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  return (
    <Ctx.Provider value={{ theme, cycleTheme, setTemporaryTheme, restoreTheme }}>
      {children}
    </Ctx.Provider>
  );
}
