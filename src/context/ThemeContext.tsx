// react
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

type Theme = "noir" | "sakura" | "blue" | "crimson";

const THEMES: Theme[] = ["noir", "sakura", "blue", "crimson"];
const THEME_KEY = "inward-theme";

interface ThemeContext {
  theme: Theme;
  cycleTheme: () => void;
}

const Ctx = createContext<ThemeContext | null>(null);

export function useTheme(): ThemeContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return THEMES.includes(saved as Theme) ? (saved as Theme) : "noir";
  });

  useEffect(() => {
    if (theme === "noir") {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = theme;
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const cycleTheme = () => {
    const idx = THEMES.indexOf(theme);
    setTheme(THEMES[(idx + 1) % THEMES.length]);
  };

  return (
    <Ctx.Provider value={{ theme, cycleTheme }}>
      {children}
    </Ctx.Provider>
  );
}
