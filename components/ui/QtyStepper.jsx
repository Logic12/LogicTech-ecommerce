"use client";
import { Minus, Plus } from "lucide-react";

export function QtyStepper({ value, min = 1, max, onChange, size = "md", label = "Quantity" }) {
  return (
    <div className={`qty qty--${size}`} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <Minus size={14} />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={max != null && value >= max} aria-label="Increase quantity">
        <Plus size={14} />
      </button>
    </div>
  );
}
