"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import { FormCard } from "@/frontend/components/form/FormCard";
import { FormCardActions } from "@/frontend/components/admin/FormCardActions";
import type { FormStatus } from "@/shared/schemas";

export interface AdminFormCardProps {
  id: string;
  title: string;
  description?: string | null;
  status: FormStatus;
  questionCount: number;
  updatedAt: string;
}

// Carte de questionnaire du dashboard admin : réutilise `FormCard` (cliquable
// vers l'éditeur) et superpose le menu d'actions (`FormCardActions`) dans le
// coin supérieur droit. Composant client (navigation + interactions).
export function AdminFormCard({
  id,
  title,
  description,
  status,
  questionCount,
  updatedAt,
}: AdminFormCardProps) {
  const router = useRouter();

  return (
    <Box sx={{ position: "relative" }}>
      <FormCard
        title={title}
        description={description}
        status={status}
        questionCount={questionCount}
        updatedAt={updatedAt}
        onClick={() => router.push(`/admin/forms/${id}/edit`)}
      />
      <Box sx={{ position: "absolute", top: 8, right: 8 }}>
        <FormCardActions id={id} title={title} status={status} />
      </Box>
    </Box>
  );
}
