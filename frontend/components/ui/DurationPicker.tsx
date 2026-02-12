"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";

const PRESET_DURATIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
  { label: "90 min", value: 90 },
  { label: "120 min", value: 120 },
];

export function DurationPicker() {
  const [minutes, setMinutes] = useState<number>(0);

  return (
    <div className="w-full space-y-4">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Clock className="h4 w4" />
        Session Duration
      </h4>
      <div className="flex flex-wrap gap-2">
        {PRESET_DURATIONS.map((preset) => (
          <Button
            key={preset.value}
            type="button"
            variant={minutes === preset.value ? "default" : "outline"}
            size="sm"
            onClick={() => setMinutes(preset.value)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Or enter custom:
        </span>
        <Input
          type="number"
          min={0}
          max={600}
          placeholder="Minutes"
          value={minutes || ""}
          onChange={(e) => setMinutes(Number(e.target.value) || 0)}
          className="w-28"
        />
        <span className="text-sm text-muted-foreground">minutes</span>
      </div>
      {minutes > 0 && (
        <p className="text-sm text-muted-foreground">
          Timer will be set to{" "}
          <span className="font-medium text-foreground">
            {Math.floor(minutes / 60) > 0 && `${Math.floor(minutes / 60)}h `}
            {minutes % 60 > 0 && `${minutes % 60}m`}
          </span>
        </p>
      )}
      <input type="hidden" name="durationMinutes" value={minutes} />
    </div>
  );
}