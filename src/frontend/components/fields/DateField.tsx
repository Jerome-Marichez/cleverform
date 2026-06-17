"use client";

import * as React from "react";
import TextField from "@mui/material/TextField";

export interface DateFieldProps {
  id?: string;
  /** Date au format ISO (YYYY-MM-DD). */
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: boolean;
  disabled?: boolean;
}

// Champ de réponse « date » (DATE). Contrôlé ; valeur ISO (YYYY-MM-DD).
// Champ HTML natif, sans dépendance supplémentaire.
export function DateField({
  id,
  value,
  onChange,
  required,
  error,
  disabled,
}: DateFieldProps) {
  return (
    <TextField
      id={id}
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      error={error}
      disabled={disabled}
      slotProps={{ inputLabel: { shrink: true } }}
      fullWidth
      size="small"
    />
  );
}
