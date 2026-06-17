"use client";

import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import type { QuestionType } from "@/shared/schemas/form";
import { questionTypeMeta } from "./questionTypeMeta";

export interface QuestionCardProps {
  label: string;
  type: QuestionType;
  required?: boolean;
  /** Numéro d'ordre affiché (1-based). */
  index?: number;
}

// Carte d'une question dans le Builder : libellé, type (icône + nom), badge
// « obligatoire » et poignée de glisser-déposer (visuelle). Theme-aware.
export function QuestionCard({ label, type, required, index }: QuestionCardProps) {
  const meta = questionTypeMeta[type];
  const Icon = meta.Icon;

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <Box
            aria-hidden
            sx={{ color: "text.disabled", cursor: "grab", display: "flex", pt: 0.25 }}
          >
            <DragIndicatorIcon />
          </Box>
          <Stack spacing={1} sx={{ flexGrow: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              {typeof index === "number" ? (
                <Typography variant="body2" color="text.secondary">
                  {index}.
                </Typography>
              ) : null}
              <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
              {required ? (
                <Chip label="Obligatoire" size="small" color="primary" variant="outlined" />
              ) : null}
            </Stack>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ alignItems: "center", color: "text.secondary" }}
            >
              <Icon fontSize="small" />
              <Typography variant="body2">{meta.label}</Typography>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
