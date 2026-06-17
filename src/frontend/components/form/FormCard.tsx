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
          sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
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
