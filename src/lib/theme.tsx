import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface Ctx {
  dark: boolean;
  toggle: () => void;
  setDark: (v: boolean) => void;
}
const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDarkState] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("cw_theme") : null;
    const prefers = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : !!prefers;
    setDarkState(isDark);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const setDark = (v: boolean) => {
    setDarkState(v);
    if (typeof window !== "undefined") localStorage.setItem("cw_theme", v ? "dark" : "light");
  };

  return <ThemeContext.Provider value={{ dark, toggle: () => setDark(!dark), setDark }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
