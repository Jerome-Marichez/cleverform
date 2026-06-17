"use client";

import * as React from "react";
import type { QuestionType } from "@/shared/schemas/form";
import { isChoiceQuestionType } from "@/shared/schemas/formInput";
import { questionTypeMeta } from "@/frontend/components/form/questionTypeMeta";

// Hook d'état LOCAL du Form Builder (logique PURE, testable sans DB ni réseau).
//
// Il gère le brouillon en cours d'édition : titre, description et liste de
// questions (ajout, suppression, réordonnancement, mise à jour, options). Chaque
// question/option porte un identifiant LOCAL stable (`localId`) pour servir de
// clé React et de cible au glisser-déposer (`@dnd-kit`), indépendamment de la
// clé Prisma. La sérialisation vers le payload d'API (`updateFormSchema`) se fait
// via `toUpdatePayload`, qui réindexe les `order` selon la position dans le tableau.

/** Option éditée dans le builder (avec identifiant local stable). */
export interface BuilderOption {
  localId: string;
  label: string;
}

/** Question éditée dans le builder (avec identifiant local stable). */
export interface BuilderQuestion {
  localId: string;
  label: string;
  type: QuestionType;
  required: boolean;
  options: BuilderOption[];
}

/** Forme minimale d'un questionnaire chargé (sous-ensemble de FormWithRelations). */
export interface FormBuilderInitialData {
  title: string;
  description?: string | null;
  questions: ReadonlyArray<{
    label: string;
    type: QuestionType;
    required: boolean;
    options: ReadonlyArray<{ label: string }>;
  }>;
}

/** Question prête à envoyer (forme `questionInputSchema`). */
export interface BuilderQuestionPayload {
  label: string;
  type: QuestionType;
  required: boolean;
  order: number;
  options: Array<{ label: string; order: number }>;
}

/** Payload d'update (forme `updateFormSchema`, hors statut). */
export interface BuilderUpdatePayload {
  title: string;
  description?: string;
  questions: BuilderQuestionPayload[];
}

// --- Génération d'identifiants locaux ---------------------------------------

let localIdCounter = 0;

/** Identifiant local unique (clé React / cible drag&drop). Pur côté process. */
export function nextLocalId(prefix = "lid"): string {
  localIdCounter += 1;
  return `${prefix}-${localIdCounter}`;
}

// --- Transformations PURES (exportées pour les tests) -----------------------

/** Convertit les données chargées en état d'édition (avec identifiants locaux). */
export function toBuilderQuestions(
  data: FormBuilderInitialData,
): BuilderQuestion[] {
  return data.questions.map((question) => ({
    localId: nextLocalId("q"),
    label: question.label,
    type: question.type,
    required: question.required,
    options: question.options.map((option) => ({
      localId: nextLocalId("o"),
      label: option.label,
    })),
  }));
}

/** Crée une question vide d'un type donné (avec une option par défaut si choix). */
export function createQuestion(type: QuestionType): BuilderQuestion {
  return {
    localId: nextLocalId("q"),
    label: "",
    type,
    required: false,
    options: isChoiceQuestionType(type)
      ? [{ localId: nextLocalId("o"), label: "" }]
      : [],
  };
}

/** Déplace un élément d'un index à un autre (immutable). */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  ) {
    return [...items];
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * Sérialise l'état d'édition en payload d'API (`updateFormSchema`) :
 *  - `title` et libellés sont rognés (trim) ;
 *  - `description` vide devient `undefined` (champ omis) ;
 *  - les options ne sont conservées que pour les types à choix ;
 *  - les `order` sont réindexés (0..n) selon la position dans les tableaux.
 * Fonction PURE.
 */
export function toUpdatePayload(
  title: string,
  description: string,
  questions: readonly BuilderQuestion[],
): BuilderUpdatePayload {
  const trimmedDescription = description.trim();
  return {
    title: title.trim(),
    ...(trimmedDescription ? { description: trimmedDescription } : {}),
    questions: questions.map((question, index) => ({
      label: question.label.trim(),
      type: question.type,
      required: question.required,
      order: index,
      options: isChoiceQuestionType(question.type)
        ? question.options.map((option, optionIndex) => ({
            label: option.label.trim(),
            order: optionIndex,
          }))
        : [],
    })),
  };
}

/** Erreur de validation locale (libellé lisible). */
export interface BuilderValidationError {
  message: string;
}

/**
 * Valide l'état d'édition AVANT envoi, en cohérence avec `updateFormSchema` :
 *  - titre non vide ;
 *  - au moins une question ;
 *  - chaque libellé de question non vide ;
 *  - chaque question à choix a au moins une option, toutes non vides.
 * Renvoie la première erreur rencontrée, ou `null` si tout est valide. Fonction PURE.
 */
export function validateBuilder(
  title: string,
  questions: readonly BuilderQuestion[],
): BuilderValidationError | null {
  if (!title.trim()) {
    return { message: "Le titre du questionnaire est requis." };
  }
  if (questions.length === 0) {
    return { message: "Un questionnaire doit comporter au moins une question." };
  }
  for (let i = 0; i < questions.length; i += 1) {
    const question = questions[i];
    const position = i + 1;
    if (!question.label.trim()) {
      return {
        message: `La question ${position} doit avoir un libellé.`,
      };
    }
    if (isChoiceQuestionType(question.type)) {
      const filled = question.options.filter((option) => option.label.trim());
      if (filled.length === 0) {
        return {
          message: `La question ${position} (« ${questionTypeMeta[question.type].label} ») doit comporter au moins une option.`,
        };
      }
      if (filled.length !== question.options.length) {
        return {
          message: `Les options de la question ${position} ne peuvent pas être vides.`,
        };
      }
    }
  }
  return null;
}

// --- Hook -------------------------------------------------------------------

export interface UseFormBuilderResult {
  title: string;
  description: string;
  questions: BuilderQuestion[];
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  addQuestion: (type: QuestionType) => void;
  removeQuestion: (localId: string) => void;
  updateQuestionLabel: (localId: string, label: string) => void;
  toggleQuestionRequired: (localId: string, required: boolean) => void;
  reorderQuestions: (fromIndex: number, toIndex: number) => void;
  addOption: (questionLocalId: string) => void;
  removeOption: (questionLocalId: string, optionLocalId: string) => void;
  updateOptionLabel: (
    questionLocalId: string,
    optionLocalId: string,
    label: string,
  ) => void;
  reorderOptions: (
    questionLocalId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;
  /** Sérialise l'état courant en payload d'API (`updateFormSchema`). */
  buildPayload: () => BuilderUpdatePayload;
  /** Valide l'état courant ; renvoie la première erreur ou `null`. */
  validate: () => BuilderValidationError | null;
}

/**
 * État local du Form Builder. Initialisé à partir des données chargées et exposant
 * des actions PURES d'édition. La persistance (PATCH/publish) reste à la charge du
 * composant appelant : ce hook ne touche ni le réseau ni la base.
 */
export function useFormBuilder(
  initial: FormBuilderInitialData,
): UseFormBuilderResult {
  const [title, setTitle] = React.useState(initial.title);
  const [description, setDescription] = React.useState(
    initial.description ?? "",
  );
  const [questions, setQuestions] = React.useState<BuilderQuestion[]>(() =>
    toBuilderQuestions(initial),
  );

  const addQuestion = React.useCallback((type: QuestionType) => {
    setQuestions((current) => [...current, createQuestion(type)]);
  }, []);

  const removeQuestion = React.useCallback((localId: string) => {
    setQuestions((current) =>
      current.filter((question) => question.localId !== localId),
    );
  }, []);

  const updateQuestionLabel = React.useCallback(
    (localId: string, label: string) => {
      setQuestions((current) =>
        current.map((question) =>
          question.localId === localId ? { ...question, label } : question,
        ),
      );
    },
    [],
  );

  const toggleQuestionRequired = React.useCallback(
    (localId: string, required: boolean) => {
      setQuestions((current) =>
        current.map((question) =>
          question.localId === localId ? { ...question, required } : question,
        ),
      );
    },
    [],
  );

  const reorderQuestions = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      setQuestions((current) => moveItem(current, fromIndex, toIndex));
    },
    [],
  );

  const addOption = React.useCallback((questionLocalId: string) => {
    setQuestions((current) =>
      current.map((question) =>
        question.localId === questionLocalId
          ? {
              ...question,
              options: [
                ...question.options,
                { localId: nextLocalId("o"), label: "" },
              ],
            }
          : question,
      ),
    );
  }, []);

  const removeOption = React.useCallback(
    (questionLocalId: string, optionLocalId: string) => {
      setQuestions((current) =>
        current.map((question) =>
          question.localId === questionLocalId
            ? {
                ...question,
                options: question.options.filter(
                  (option) => option.localId !== optionLocalId,
                ),
              }
            : question,
        ),
      );
    },
    [],
  );

  const updateOptionLabel = React.useCallback(
    (questionLocalId: string, optionLocalId: string, label: string) => {
      setQuestions((current) =>
        current.map((question) =>
          question.localId === questionLocalId
            ? {
                ...question,
                options: question.options.map((option) =>
                  option.localId === optionLocalId
                    ? { ...option, label }
                    : option,
                ),
              }
            : question,
        ),
      );
    },
    [],
  );

  const reorderOptions = React.useCallback(
    (questionLocalId: string, fromIndex: number, toIndex: number) => {
      setQuestions((current) =>
        current.map((question) =>
          question.localId === questionLocalId
            ? { ...question, options: moveItem(question.options, fromIndex, toIndex) }
            : question,
        ),
      );
    },
    [],
  );

  const buildPayload = React.useCallback(
    () => toUpdatePayload(title, description, questions),
    [title, description, questions],
  );

  const validate = React.useCallback(
    () => validateBuilder(title, questions),
    [title, questions],
  );

  return {
    title,
    description,
    questions,
    setTitle,
    setDescription,
    addQuestion,
    removeQuestion,
    updateQuestionLabel,
    toggleQuestionRequired,
    reorderQuestions,
    addOption,
    removeOption,
    updateOptionLabel,
    reorderOptions,
    buildPayload,
    validate,
  };
}
