"use client";

import * as React from "react";
import TextField from "@mui/material/TextField";

export interface EmailFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: boolean;
  disabled?: boolean;
}

// Champ de réponse « e-mail » (EMAIL). Contrôlé.
export function EmailField({
  id,
  value,
  onChange,
  required,
  error,
  disabled,
}: EmailFieldProps) {
  return (
    <TextField
      id={id}
      type="email"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      error={error}
      disabled={disabled}
      placeholder="nom@exemple.fr"
      fullWidth
      size="small"
    />
  );
}
