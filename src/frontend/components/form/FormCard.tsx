"use client";

import * as React from "react";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import QuizIcon from "@mui/icons-material/QuizOutlined";
import { FormStatusChip, type FormStatus } from "./FormStatusChip";

export interface FormCardProps {
  title: string;
  description?: string | null;
  status: FormStatus;
  questionCount: number;
  /** Date de dernière modification (Date ou ISO string). */
  updatedAt: Date | string;
  onClick?: () => void;
  /**
   * Réserve un espace à droite de l'en-tête pour un bouton d'action superposé
   * (ex. le menu ⋮ d'`AdminFormCard`), afin qu'il ne chevauche pas le badge de
   * statut. Sans effet sur l'usage public de la carte.
   */
  reserveActionSlot?: boolean;
}

// Carte d'un questionnaire dans la liste du Builder : titre, description, statut,
// nombre de questions et date. Theme-aware ; cliquable si `onClick` est fourni.
export function FormCard({
  title,
  description,
  status,
  questionCount,
  updatedAt,
  onClick,
  reserveActionSlot = false,
}: FormCardProps) {
  const date = typeof updatedAt === "string" ? new Date(updatedAt) : updatedAt;
  const dateLabel = date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const content = (
    <CardContent>
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "flex-start",
            justifyContent: "space-between",
            // Laisse la place au bouton d'action superposé (menu ⋮) pour que le
            // badge de statut ne passe pas dessous.
            pr: reserveActionSlot ? 4.5 : 0,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <FormStatusChip status={status} />
        </Stack>
        {description ? (
          <Typography
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </Typography>
        ) : null}
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", color: "text.secondary" }}
        >
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <QuizIcon fontSize="small" />
            <Typography variant="body2">
              {questionCount} question{questionCount > 1 ? "s" : ""}
            </Typography>
          </Stack>
          <Typography variant="body2">Modifié le {dateLabel}</Typography>
        </Stack>
      </Stack>
    </CardContent>
  );

  return <Card>{onClick ? <CardActionArea onClick={onClick}>{content}</CardActionArea> : content}</Card>;
}
