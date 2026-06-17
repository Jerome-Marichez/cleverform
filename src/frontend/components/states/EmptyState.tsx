"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import InboxIcon from "@mui/icons-material/InboxOutlined";

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Icône d'amorçage (défaut : boîte vide). */
  icon?: React.ReactNode;
  /** Appel à l'action optionnel (ex. bouton « Créer »). */
  action?: React.ReactNode;
}

// État vide réutilisable : message d'amorçage (ex. « Aucune réponse pour le
// moment ») avec une éventuelle action. Theme-aware (clair / sombre).
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Stack
      spacing={2}
      sx={{ alignItems: "center", textAlign: "center", py: 6 }}
    >
      <Box sx={{ color: "text.disabled", "& svg": { fontSize: 48 } }}>
        {icon ?? <InboxIcon />}
      </Box>
      <Typography variant="h6">{title}</Typography>
      {description ? (
        <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      ) : null}
      {action}
    </Stack>
  );
}
