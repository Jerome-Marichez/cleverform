"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { GenerateWithAiDialog } from "@/frontend/components/admin/GenerateWithAiDialog";

export interface GenerateWithAiButtonProps {
  /** Libellé du bouton (défaut : « Générer par IA »). */
  label?: string;
  /** Variante MUI du bouton (défaut : « outlined »). */
  variant?: ButtonProps["variant"];
}

// Bouton d'amorçage de la génération assistée par IA : ouvre la boîte de dialogue
// `GenerateWithAiDialog`. Placé à côté de « Nouveau questionnaire » sur le
// dashboard. Composant client (état d'ouverture local).
export function GenerateWithAiButton({
  label = "Générer par IA",
  variant = "outlined",
}: GenerateWithAiButtonProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        variant={variant}
        startIcon={<AutoAwesomeIcon />}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <GenerateWithAiDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
