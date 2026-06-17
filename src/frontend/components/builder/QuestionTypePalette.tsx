"use client";

import * as React from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { QuestionType } from "@/shared/schemas/form";
import { questionTypeMeta } from "@/frontend/components/form/questionTypeMeta";

export interface QuestionTypePaletteProps {
  /** Appelé avec le type choisi lorsqu'on clique sur un bouton de la palette. */
  onAddQuestion: (type: QuestionType) => void;
  /** Désactive toute la palette (ex. pendant un enregistrement). */
  disabled?: boolean;
}

// Ordre d'affichage des types dans la palette (dérivé de l'enum partagé).
const QUESTION_TYPES = Object.keys(questionTypeMeta) as QuestionType[];

// Palette des types de question : chaque bouton ajoute une question du type
// correspondant à la fin de la liste. Theme-aware (boutons MUI outlined).
export function QuestionTypePalette({
  onAddQuestion,
  disabled,
}: QuestionTypePaletteProps) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" color="text.secondary">
        Ajouter une question
      </Typography>
      <Stack
        direction="row"
        useFlexGap
        sx={{ flexWrap: "wrap", gap: 1 }}
      >
        {QUESTION_TYPES.map((type) => {
          const meta = questionTypeMeta[type];
          const Icon = meta.Icon;
          return (
            <Button
              key={type}
              variant="outlined"
              size="small"
              startIcon={<Icon fontSize="small" />}
              onClick={() => onAddQuestion(type)}
              disabled={disabled}
            >
              {meta.label}
            </Button>
          );
        })}
      </Stack>
    </Stack>
  );
}
