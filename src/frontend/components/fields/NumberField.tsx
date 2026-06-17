"use client";

import * as React from "react";
import TextField from "@mui/material/TextField";

export interface NumberFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: boolean;
  disabled?: boolean;
}

// Champ de réponse « nombre » (NUMBER). Contrôlé ; la valeur reste une chaîne
// (cohérent avec le stockage `Answer.value`).
export function NumberField({
  id,
  value,
  onChange,
  required,
  error,
  disabled,
}: NumberFieldProps) {
  return (
    <TextField
      id={id}
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      error={error}
      disabled={disabled}
      fullWidth
      size="small"
    />
  );
}
