"use client";

import * as React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  buildSubmitResponseSchema,
  type AnswerInput,
  type PublicForm,
  type PublicQuestion,
  type QuestionType,
  type SubmitResponseInput,
} from "@/shared/schemas";
import type { AnswerValue } from "@/frontend/components/fields/QuestionField";

// Hook & utilitaires de la page de remplissage (Form Responder).
//
// Deux mondes coexistent :
//  - le `QuestionField` (présentational) travaille avec une `AnswerValue`
//    (string | string[] | number | null) et, pour les choix, des **libellés**
//    d'options (il ne connaît pas les `id`) ;
//  - le backend attend des `AnswerInput` (`{ questionId, value?, selectedOptionIds? }`)
//    où les choix sont désignés par leur **identifiant** d'option.
//
// Ce module concentre la conversion entre ces deux formes (testable isolément)
// et expose un hook prêt à brancher sur React Hook Form, validé côté client par
// le même schéma Zod paramétré que le backend (`buildSubmitResponseSchema`).

/** Valeur par défaut (vide) attendue par `QuestionField` selon le type. */
export function defaultFieldValue(type: QuestionType): AnswerValue {
  switch (type) {
    case "MULTIPLE_CHOICE":
      return [];
    case "RATING":
      return null;
    default:
      return "";
  }
}

/**
 * Valeurs par défaut d'une soumission : un `AnswerInput` vide par question, dans
 * l'ordre des questions. La forme `{ answers: [...] }` correspond exactement à
 * `SubmitResponseInput`, ce qui permet de valider avec le même schéma que le
 * backend.
 */
export function buildDefaultValues(
  questions: ReadonlyArray<Pick<PublicQuestion, "id">>,
): SubmitResponseInput {
  return {
    answers: questions.map((question) => ({ questionId: question.id })),
  };
}

/**
 * `AnswerInput` → valeur d'affichage pour `QuestionField`. Pour les types à
 * choix, on convertit les `selectedOptionIds` en **libellés** (ce que
 * `QuestionField` manipule). Pour `RATING`, on parse l'entier ; pour les autres
 * scalaires, on renvoie la chaîne telle quelle.
 */
export function answerToFieldValue(
  question: PublicQuestion,
  answer: AnswerInput,
): AnswerValue {
  switch (question.type) {
    case "SINGLE_CHOICE": {
      const id = answer.selectedOptionIds?.[0];
      return labelForOptionId(question, id) ?? "";
    }
    case "MULTIPLE_CHOICE":
      return (answer.selectedOptionIds ?? [])
        .map((id) => labelForOptionId(question, id))
        .filter((label): label is string => label != null);
    case "RATING": {
      if (answer.value == null || answer.value === "") return null;
      const parsed = Number(answer.value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    default:
      return answer.value ?? "";
  }
}

/**
 * Valeur d'affichage `QuestionField` → `AnswerInput` (forme envoyée au backend).
 * Les libellés de choix sont reconvertis en `selectedOptionIds` ; la note et les
 * scalaires sont sérialisés en `value` (chaîne, cohérent avec `Answer.value`).
 */
export function fieldValueToAnswer(
  question: PublicQuestion,
  value: AnswerValue,
): AnswerInput {
  const base = { questionId: question.id };

  switch (question.type) {
    case "SINGLE_CHOICE": {
      const id = typeof value === "string" ? optionIdForLabel(question, value) : undefined;
      return { ...base, selectedOptionIds: id ? [id] : [] };
    }
    case "MULTIPLE_CHOICE": {
      const labels = Array.isArray(value) ? value : [];
      const ids = labels
        .map((label) => optionIdForLabel(question, label))
        .filter((id): id is string => id != null);
      return { ...base, selectedOptionIds: ids };
    }
    case "RATING":
      return { ...base, value: value == null ? "" : String(value) };
    default:
      return { ...base, value: typeof value === "string" ? value : "" };
  }
}

/** Libellés d'options d'une question (pour alimenter `QuestionField.options`). */
export function optionLabels(question: PublicQuestion): string[] {
  return question.options.map((option) => option.label);
}

function labelForOptionId(question: PublicQuestion, id: string | undefined): string | undefined {
  if (!id) return undefined;
  return question.options.find((option) => option.id === id)?.label;
}

function optionIdForLabel(question: PublicQuestion, label: string): string | undefined {
  return question.options.find((option) => option.label === label)?.id;
}

export interface UseResponderFormResult {
  form: ReturnType<typeof useForm<SubmitResponseInput>>;
  /** Lit la valeur d'affichage courante d'une question (pour `Controller`). */
  toFieldValue: (question: PublicQuestion, answer: AnswerInput) => AnswerValue;
  /** Convertit une valeur d'affichage en `AnswerInput` (pour `Controller.onChange`). */
  toAnswer: (question: PublicQuestion, value: AnswerValue) => AnswerInput;
}

/**
 * Hook du Form Responder : initialise React Hook Form avec un `AnswerInput` par
 * question et le résolveur Zod paramétré par la définition du questionnaire
 * (mêmes règles que le backend : requis, e-mail, nombre, date, cardinalité des
 * choix). Renvoie aussi les convertisseurs valeur d'affichage ⇄ `AnswerInput`.
 */
export function useResponderForm(form: PublicForm): UseResponderFormResult {
  const schema = React.useMemo(
    () => buildSubmitResponseSchema(form.questions),
    [form.questions],
  );

  const rhf = useForm<SubmitResponseInput>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(form.questions),
    mode: "onSubmit",
  });

  return {
    form: rhf,
    toFieldValue: answerToFieldValue,
    toAnswer: fieldValueToAnswer,
  };
}

export type { SubmitHandler };
