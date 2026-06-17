"use client";

import * as React from "react";
import TextField from "@mui/material/TextField";

export interface ShortTextFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

// Champ de réponse « texte court » (SHORT_TEXT). Contrôlé.
export function ShortTextField({
  id,
  value,
  onChange,
  required,
  error,
  disabled,
  placeholder,
}: ShortTextFieldProps) {
  return (
    <TextField
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      error={error}
      disabled={disabled}
      placeholder={placeholder}
      fullWidth
      size="small"
    />
  );
}
