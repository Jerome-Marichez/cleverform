"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { QuestionType } from "@/shared/schemas/form";
import { ShortTextField } from "./ShortTextField";
import { LongTextField } from "./LongTextField";
import { NumberField } from "./NumberField";
import { EmailField } from "./EmailField";
import { DateField } from "./DateField";
import { SingleChoiceField } from "./SingleChoiceField";
import { MultipleChoiceField } from "./MultipleChoiceField";
import { RatingField } from "./RatingField";

/** Valeur d'une réponse, selon le type de question. */
export type AnswerValue = string | string[] | number | null;

export interface QuestionFieldProps {
  id?: string;
  label: string;
  type: QuestionType;
  required?: boolean;
  /** Options (pour SINGLE_CHOICE / MULTIPLE_CHOICE). */
  options?: string[];
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  /** Message d'erreur de validation (affiché en inline). */
  error?: string;
  disabled?: boolean;
}

const asString = (v: AnswerValue): string => (typeof v === "string" ? v : "");
const asStringArray = (v: AnswerValue): string[] => (Array.isArray(v) ? v : []);
const asNumber = (v: AnswerValue): number | null => (typeof v === "number" ? v : null);

// Dispatcher : choisit le champ adapté au type de question et l'enveloppe d'un
// libellé (avec marqueur « obligatoire ») et d'un message d'erreur inline.
// Contrôlé et présentational (à piloter ensuite par React Hook Form).
export function QuestionField({
  id,
  label,
  type,
  required,
  options = [],
  value,
  onChange,
  error,
  disabled,
}: QuestionFieldProps) {
  const hasError = Boolean(error);

  let field: React.ReactNode;
  switch (type) {
    case "SHORT_TEXT":
      field = <ShortTextField id={id} value={asString(value)} onChange={onChange} required={required} error={hasError} disabled={disabled} />;
      break;
    case "LONG_TEXT":
      field = <LongTextField id={id} value={asString(value)} onChange={onChange} required={required} error={hasError} disabled={disabled} />;
      break;
    case "NUMBER":
      field = <NumberField id={id} value={asString(value)} onChange={onChange} required={required} error={hasError} disabled={disabled} />;
      break;
    case "EMAIL":
      field = <EmailField id={id} value={asString(value)} onChange={onChange} required={required} error={hasError} disabled={disabled} />;
      break;
    case "DATE":
      field = <DateField id={id} value={asString(value)} onChange={onChange} required={required} error={hasError} disabled={disabled} />;
      break;
    case "SINGLE_CHOICE":
      field = <SingleChoiceField value={asString(value)} onChange={onChange} options={options} disabled={disabled} />;
      break;
    case "MULTIPLE_CHOICE":
      field = <MultipleChoiceField value={asStringArray(value)} onChange={onChange} options={options} disabled={disabled} />;
      break;
    case "RATING":
      field = <RatingField value={asNumber(value)} onChange={onChange} disabled={disabled} />;
      break;
    default:
      field = null;
  }

  return (
    <Box>
      <Typography
        component="label"
        htmlFor={id}
        sx={{ display: "block", mb: 1, fontWeight: 600, color: "text.primary" }}
      >
        {label}
        {required ? (
          <Box component="span" aria-hidden sx={{ color: "error.main", ml: 0.5 }}>
            *
          </Box>
        ) : null}
      </Typography>
      {field}
      {error ? (
        <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
          {error}
        </Typography>
      ) : null}
    </Box>
  );
}
