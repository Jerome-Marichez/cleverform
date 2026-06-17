"use client";

import * as React from "react";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";

export interface SingleChoiceFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
}

// Champ de réponse « choix unique » (SINGLE_CHOICE). Contrôlé (boutons radio).
export function SingleChoiceField({
  value,
  onChange,
  options,
  disabled,
}: SingleChoiceFieldProps) {
  return (
    <RadioGroup value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((option) => (
        <FormControlLabel
          key={option}
          value={option}
          control={<Radio />}
          label={option}
          disabled={disabled}
        />
      ))}
    </RadioGroup>
  );
}
