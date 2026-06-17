"use client";

import * as React from "react";
import TextField from "@mui/material/TextField";

export interface LongTextFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: boolean;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
}

// Champ de réponse « texte long » (LONG_TEXT). Contrôlé, multiligne.
export function LongTextField({
  id,
  value,
  onChange,
  required,
  error,
  disabled,
  placeholder,
  rows = 4,
}: LongTextFieldProps) {
  return (
    <TextField
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      error={error}
      disabled={disabled}
      placeholder={placeholder}
      multiline
      minRows={rows}
      fullWidth
    />
  );
}
