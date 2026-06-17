"use client";

import * as React from "react";
import Tooltip from "@mui/material/Tooltip";
import type { QuestionType } from "@/shared/schemas/form";
import { questionTypeMeta } from "./questionTypeMeta";

export interface QuestionTypeIconProps {
  type: QuestionType;
  fontSize?: "inherit" | "small" | "medium" | "large";
}

// Icône (avec infobulle) représentant un type de question.
export function QuestionTypeIcon({ type, fontSize = "small" }: QuestionTypeIconProps) {
  const { Icon, label } = questionTypeMeta[type];
  return (
    <Tooltip title={label}>
      <Icon fontSize={fontSize} color="action" aria-label={label} />
    </Tooltip>
  );
}
