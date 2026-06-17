"use client";

import * as React from "react";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

export interface MultipleChoiceFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  disabled?: boolean;
}

// Champ de réponse « choix multiple » (MULTIPLE_CHOICE). Contrôlé (cases à cocher).
export function MultipleChoiceField({
  value,
  onChange,
  options,
  disabled,
}: MultipleChoiceFieldProps) {
  const toggle = (option: string) => {
    onChange(
      value.includes(option)
        ? value.filter((v) => v !== option)
        : [...value, option],
    );
  };

  return (
    <FormGroup>
      {options.map((option) => (
        <FormControlLabel
          key={option}
          control={
            <Checkbox
              checked={value.includes(option)}
              onChange={() => toggle(option)}
              disabled={disabled}
            />
          }
          label={option}
        />
      ))}
    </FormGroup>
  );
}
