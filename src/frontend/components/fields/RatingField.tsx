"use client";

import * as React from "react";
import Rating from "@mui/material/Rating";

export interface RatingFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
  max?: number;
  disabled?: boolean;
}

// Champ de réponse « note » (RATING). Contrôlé (étoiles).
export function RatingField({
  value,
  onChange,
  max = 5,
  disabled,
}: RatingFieldProps) {
  return (
    <Rating
      value={value}
      onChange={(_event, next) => onChange(next)}
      max={max}
      disabled={disabled}
      size="large"
    />
  );
}
