"use client";

import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  useTheme,
  PALETTES,
  TEXT_SIZES,
  type Palette,
} from "@/components/theme-provider";

function PaletteCard({
  palette,
  selected,
  onSelect,
}: {
  palette: Palette;
  selected: boolean;
  onSelect: () => void;
}) {
  const swatches = [
    { color: palette.primary, label: "Primary" },
    { color: palette.secondary, label: "Secondary" },
    { color: palette.tertiary, label: "Tertiary" },
    { color: palette.neutral, label: "Neutral" },
  ];

  return (
    <Card
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`relative cursor-pointer p-5 transition-all hover:-translate-y-0.5 ${
        selected ? "ring-2 ring-primary shadow-md" : "hover:shadow-sm"
      }`}
    >
      {selected && (
        <div className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" />
        </div>
      )}

      <p className="mb-4 text-sm font-semibold">{palette.name}</p>

      <div className="flex items-center gap-3">
        {swatches.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1.5">
            <div
              className="size-8 rounded-full border border-border shadow-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-[10px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TextSizeOption({
  label,
  value,
  selected,
  onSelect,
}: {
  label: string;
  value: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex flex-col items-center gap-2 rounded-xl border px-6 py-4 transition-all ${
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:border-primary/40"
      }`}
    >
      <span style={{ fontSize: value }} className="font-medium leading-none">
        Aa
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-[10px] text-muted-foreground/60">{value}</span>
    </button>
  );
}

export default function SettingsPage() {
  const { paletteId, textSizeId, setPalette, setTextSize } = useTheme();

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customize how Tars looks and feels.
          </p>
        </div>

        <section>
          <h2 className="mb-1 text-lg font-semibold">Color Palette</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Pick a palette. Changes apply instantly.
          </p>

          <div
            role="radiogroup"
            aria-label="Color palette"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {PALETTES.map((p) => (
              <PaletteCard
                key={p.id}
                palette={p}
                selected={paletteId === p.id}
                onSelect={() => setPalette(p.id)}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-1 text-lg font-semibold">Text Size</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Choose a base font size for the interface.
          </p>

          <div role="radiogroup" aria-label="Text size" className="flex gap-4">
            {TEXT_SIZES.map((s) => (
              <TextSizeOption
                key={s.id}
                label={s.label}
                value={s.value}
                selected={textSizeId === s.id}
                onSelect={() => setTextSize(s.id)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
