"use client";

import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";

export interface ThankYouScreenProps {
  /** Titre du questionnaire rempli (rappelé au répondant). */
  title: string;
}

// Écran de remerciement affiché après une soumission réussie. Confirme la prise
// en compte de la réponse, sans rouvrir le formulaire (surface write-only).
// Theme-aware (clair / sombre).
export function ThankYouScreen({ title }: ThankYouScreenProps) {
  return (
    <Card role="status" aria-live="polite">
      <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
        <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 56 }} />
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
            Merci pour votre réponse !
          </Typography>
          <Typography color="text.secondary">
            Votre réponse au questionnaire «&nbsp;{title}&nbsp;» a bien été
            enregistrée.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
