"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface Palette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  tertiary: string;
  neutral: string;
}

export const PALETTES: Palette[] = [
  {
    id: "warm-brown",
    name: "Warm Brown",
    primary: "#6b4c3a",
    secondary: "#f0ebe3",
    tertiary: "#d1c5b4",
    neutral: "#8a7e76",
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    primary: "#2563eb",
    secondary: "#eff6ff",
    tertiary: "#bfdbfe",
    neutral: "#64748b",
  },
  {
    id: "forest-green",
    name: "Forest Green",
    primary: "#16a34a",
    secondary: "#f0fdf4",
    tertiary: "#bbf7d0",
    neutral: "#6b7280",
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    primary: "#7c3aed",
    secondary: "#faf5ff",
    tertiary: "#ddd6fe",
    neutral: "#71717a",
  },
  {
    id: "slate",
    name: "Slate",
    primary: "#334155",
    secondary: "#f8fafc",
    tertiary: "#cbd5e1",
    neutral: "#94a3b8",
  },
];

export interface TextSize {
  id: string;
  label: string;
  value: string;
}

export const TEXT_SIZES: TextSize[] = [
  { id: "small", label: "Small", value: "12px" },
  { id: "medium", label: "Medium", value: "14px" },
  { id: "large", label: "Large", value: "16px" },
];

const STORAGE_KEY = "tars-theme";
const DEFAULT_PALETTE_ID = "warm-brown";
const DEFAULT_TEXT_SIZE_ID = "medium";

interface ThemeState {
  paletteId: string;
  textSizeId: string;
}

interface ThemeContextValue {
  paletteId: string;
  textSizeId: string;
  setPalette: (id: string) => void;
  setTextSize: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyPalette(palette: Palette) {
  const root = document.documentElement;
  const s = root.style;

  s.setProperty("--primary", palette.primary);
  s.setProperty("--ring", palette.primary);
  s.setProperty("--sidebar-primary", palette.primary);
  s.setProperty("--sidebar-ring", palette.primary);

  s.setProperty("--secondary", palette.secondary);
  s.setProperty("--muted", palette.secondary);
  s.setProperty("--accent", palette.secondary);
  s.setProperty("--sidebar-accent", palette.secondary);
  s.setProperty("--card", palette.secondary);
  s.setProperty("--popover", palette.secondary);

  s.setProperty("--border", palette.tertiary);
  s.setProperty("--input", palette.tertiary);
  s.setProperty("--sidebar-border", palette.tertiary);

  s.setProperty("--muted-foreground", palette.neutral);
}

function applyTextSize(size: TextSize) {
  document.documentElement.style.fontSize = size.value;
}

function readStorage(): ThemeState {
  if (typeof window === "undefined")
    return { paletteId: DEFAULT_PALETTE_ID, textSizeId: DEFAULT_TEXT_SIZE_ID };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ThemeState;
  } catch {}
  return { paletteId: DEFAULT_PALETTE_ID, textSizeId: DEFAULT_TEXT_SIZE_ID };
}

function writeStorage(state: ThemeState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [paletteId, setPaletteId] = useState(DEFAULT_PALETTE_ID);
  const [textSizeId, setTextSizeId] = useState(DEFAULT_TEXT_SIZE_ID);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStorage();
    setPaletteId(stored.paletteId);
    setTextSizeId(stored.textSizeId);

    const palette = PALETTES.find((p) => p.id === stored.paletteId);
    const size = TEXT_SIZES.find((s) => s.id === stored.textSizeId);

    if (palette && stored.paletteId !== DEFAULT_PALETTE_ID)
      applyPalette(palette);
    if (size) applyTextSize(size);

    setHydrated(true);
  }, []);

  const setPalette = useCallback(
    (id: string) => {
      const palette = PALETTES.find((p) => p.id === id);
      if (!palette) return;
      setPaletteId(id);
      applyPalette(palette);
      writeStorage({ paletteId: id, textSizeId });
    },
    [textSizeId],
  );

  const setTextSize = useCallback(
    (id: string) => {
      const size = TEXT_SIZES.find((s) => s.id === id);
      if (!size) return;
      setTextSizeId(id);
      applyTextSize(size);
      writeStorage({ paletteId, textSizeId: id });
    },
    [paletteId],
  );

  return (
    <ThemeContext.Provider
      value={{ paletteId, textSizeId, setPalette, setTextSize }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
