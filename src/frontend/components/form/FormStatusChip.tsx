"use client";

import * as React from "react";
import Chip from "@mui/material/Chip";

export type FormStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

const STATUS_META: Record<
  FormStatus,
  { label: string; color: "default" | "success" | "warning" }
> = {
  DRAFT: { label: "Brouillon", color: "warning" },
  PUBLISHED: { label: "Publié", color: "success" },
  CLOSED: { label: "Clôturé", color: "default" },
};

// Puce de statut d'un formulaire (DRAFT / PUBLISHED / CLOSED). Theme-aware.
export function FormStatusChip({ status }: { status: FormStatus }) {
  const meta = STATUS_META[status];
  return <Chip label={meta.label} color={meta.color} size="small" />;
}
