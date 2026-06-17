"use client";

import * as React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";

export interface ErrorStateProps {
  title?: string;
  /** Détail de l'erreur (message lisible). */
  message?: string;
  /** Action de reprise ; si fournie, un bouton « Réessayer » est affiché. */
  onRetry?: () => void;
  retryLabel?: string;
}

// État d'erreur réutilisable : message clair + action de reprise optionnelle.
export function ErrorState({
  title = "Une erreur est survenue",
  message,
  onRetry,
  retryLabel = "Réessayer",
}: ErrorStateProps) {
  return (
    <Stack
      spacing={2}
      role="alert"
      sx={{ alignItems: "center", textAlign: "center", py: 6 }}
    >
      <ErrorOutlineIcon color="error" sx={{ fontSize: 48 }} />
      <Typography variant="h6">{title}</Typography>
      {message ? <Typography color="text.secondary">{message}</Typography> : null}
      {onRetry ? (
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </Stack>
  );
}
