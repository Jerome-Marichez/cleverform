"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import { CreateFormDialog } from "@/frontend/components/admin/CreateFormDialog";

export interface NewFormButtonProps {
  /** Libellé du bouton (défaut : « Nouveau questionnaire »). */
  label?: string;
  /** Variante MUI du bouton (défaut : « contained »). */
  variant?: ButtonProps["variant"];
}

// Bouton d'amorçage de la création d'un questionnaire : ouvre la boîte de
// dialogue `CreateFormDialog`. Réutilisable dans l'en-tête de page comme dans
// l'état vide (appel à l'action). Composant client (état d'ouverture local).
export function NewFormButton({
  label = "Nouveau questionnaire",
  variant = "contained",
}: NewFormButtonProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        variant={variant}
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <CreateFormDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
