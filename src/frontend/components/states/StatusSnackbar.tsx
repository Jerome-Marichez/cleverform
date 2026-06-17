"use client";

import * as React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import type { AlertColor } from "@mui/material/Alert";

export interface StatusSnackbarProps {
  open: boolean;
  message: string;
  /** Type de message (succès par défaut). */
  severity?: AlertColor;
  /** Durée d'affichage avant fermeture auto (ms). */
  autoHideDuration?: number;
  onClose: () => void;
}

// Toast de confirmation / erreur (présentational). À piloter par l'état parent.
// Theme-aware (clair / sombre).
export function StatusSnackbar({
  open,
  message,
  severity = "success",
  autoHideDuration = 4000,
  onClose,
}: StatusSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
