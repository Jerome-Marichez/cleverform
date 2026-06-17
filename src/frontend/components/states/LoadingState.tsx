"use client";

import * as React from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export interface LoadingStateProps {
  /** "spinner" (par défaut) ou "skeleton" (esquisse de contenu). */
  variant?: "spinner" | "skeleton";
  /** Texte affiché sous le spinner. */
  label?: string;
  /** Nombre de lignes pour la variante squelette. */
  rows?: number;
}

// État de chargement réutilisable (ex. pendant la génération IA).
// Theme-aware (clair / sombre). Accessible : `aria-busy` + `aria-live`.
export function LoadingState({
  variant = "spinner",
  label = "Chargement…",
  rows = 3,
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <Stack spacing={1.5} aria-busy="true" aria-live="polite">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={i === 0 ? 40 : 24}
            width={i === 0 ? "60%" : "100%"}
          />
        ))}
      </Stack>
    );
  }

  return (
    <Stack
      spacing={2}
      aria-busy="true"
      aria-live="polite"
      sx={{ alignItems: "center", py: 6 }}
    >
      <CircularProgress />
      {label ? <Typography color="text.secondary">{label}</Typography> : null}
    </Stack>
  );
}
