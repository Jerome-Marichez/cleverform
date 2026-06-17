import { z } from "zod";

import {
  formStatusSchema,
  questionTypeSchema,
  type QuestionType,
} from "@/shared/schemas/form";

// Schémas d'ENTRÉE du Form Builder (côté admin) : création, mise à jour et
// réordonnancement des questionnaires. Distincts des schémas de SORTIE IA
// (`form.ts`) et de soumission publique (`response.ts`). Voir docs/data-model.md.
//
// Règles transverses :
//  - les libellés (form, question, option) sont des chaînes non vides ;
//  - `order` est un entier >= 0 (position d'affichage) ;
//  - les options ne sont **requises** que pour les types à choix
//    (SINGLE_CHOICE / MULTIPLE_CHOICE) — imposé par `superRefine`.

/** Types de question qui exigent une liste d'options non vide. */
export const CHOICE_QUESTION_TYPES: readonly QuestionType[] = [
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
];

/** Indique si un type de question repose sur une liste d'options (choix). */
export function isChoiceQuestionType(type: QuestionType): boolean {
  return CHOICE_QUESTION_TYPES.includes(type);
}

// --- Option ----------------------------------------------------------------

export const optionInputSchema = z.object({
  label: z.string().trim().min(1, { error: "Le libellé de l'option est requis." }),
  order: z
    .number({ error: "L'ordre de l'option doit être un nombre." })
    .int({ error: "L'ordre de l'option doit être un entier." })
    .min(0, { error: "L'ordre de l'option ne peut pas être négatif." }),
});
export type OptionInput = z.infer<typeof optionInputSchema>;

// --- Question --------------------------------------------------------------

export const questionInputSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(1, { error: "Le libellé de la question est requis." }),
    type: questionTypeSchema,
    required: z.boolean().default(false),
    order: z
      .number({ error: "L'ordre de la question doit être un nombre." })
      .int({ error: "L'ordre de la question doit être un entier." })
      .min(0, { error: "L'ordre de la question ne peut pas être négatif." }),
    options: z.array(optionInputSchema).default([]),
  })
  .superRefine((question, ctx) => {
    const requiresOptions = isChoiceQuestionType(question.type);

    if (requiresOptions && question.options.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message:
          "Une question à choix doit comporter au moins une option.",
      });
    }

    if (!requiresOptions && question.options.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message:
          "Seules les questions à choix (unique ou multiple) peuvent avoir des options.",
      });
    }
  });
export type QuestionInput = z.infer<typeof questionInputSchema>;

// --- Form (création) -------------------------------------------------------

export const createFormSchema = z.object({
  title: z.string().trim().min(1, { error: "Le titre du questionnaire est requis." }),
  description: z.string().trim().optional(),
  questions: z
    .array(questionInputSchema)
    .min(1, { error: "Un questionnaire doit comporter au moins une question." }),
});
export type CreateFormInput = z.infer<typeof createFormSchema>;

// --- Form (mise à jour) ----------------------------------------------------

// Mise à jour partielle : tous les champs sont optionnels (PATCH). Le statut
// peut évoluer (publication / clôture). Au moins un champ doit être fourni.
export const updateFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, { error: "Le titre du questionnaire est requis." })
      .optional(),
    description: z.string().trim().optional(),
    status: formStatusSchema.optional(),
    questions: z
      .array(questionInputSchema)
      .min(1, { error: "Un questionnaire doit comporter au moins une question." })
      .optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    error: "La mise à jour doit modifier au moins un champ.",
  });
export type UpdateFormInput = z.infer<typeof updateFormSchema>;

// --- Réordonnancement ------------------------------------------------------

// Liste ordonnée d'identifiants (questions ou options) : l'ordre du tableau
// définit la nouvelle position. Les identifiants doivent être uniques.
export const reorderSchema = z
  .object({
    orderedIds: z
      .array(z.string().min(1, { error: "Un identifiant ne peut pas être vide." }))
      .min(1, { error: "La liste à réordonner ne peut pas être vide." }),
  })
  .refine(
    (data) => new Set(data.orderedIds).size === data.orderedIds.length,
    { error: "Les identifiants à réordonner doivent être uniques.", path: ["orderedIds"] },
  );
export type ReorderInput = z.infer<typeof reorderSchema>;
