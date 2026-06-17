"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

export interface LogoProps {
  /** "full" = pictogramme + nom ; "mark" = pictogramme seul. */
  variant?: "full" | "mark";
  /** Hauteur du pictogramme, en pixels. */
  size?: number;
}

// Marque CleverForm. Le carré du pictogramme reprend le **vert du thème** (donc
// éclairci en mode sombre), mais la coche reste **blanche** dans les deux modes :
// la marque se lit ainsi toujours « blanc + vert ». Sans cela, en thème sombre le
// vert s'éclaircit et la couleur de contraste calculée bascule au noir (coche
// noire au lieu de blanche). Le nom, lui, suit le thème (« Clever » s'adapte,
// « Form » reste vert).
export function Logo({ variant = "full", size = 32 }: LogoProps) {
  const theme = useTheme();
  const brand = theme.vars?.palette.primary.main ?? theme.palette.primary.main;
  const onBrand =
    theme.vars?.palette.common.white ?? theme.palette.common.white;

  const mark = (
    <Box
      component="svg"
      viewBox="0 0 32 32"
      role="img"
      aria-label="CleverForm"
      sx={{ width: size, height: size, flexShrink: 0 }}
    >
      <rect width="32" height="32" rx="8" fill={brand} />
      <path
        d="M9 16.5l4.5 4.5L23 11"
        fill="none"
        stroke={onBrand}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );

  if (variant === "mark") return mark;

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      {mark}
      <Typography
        component="span"
        sx={{ fontWeight: 700, fontSize: size * 0.58, lineHeight: 1, letterSpacing: "-0.01em" }}
      >
        <Box component="span" sx={{ color: "text.primary" }}>
          Clever
        </Box>
        <Box component="span" sx={{ color: "primary.main" }}>
          Form
        </Box>
      </Typography>
    </Box>
  );
}
