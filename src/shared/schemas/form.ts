import { z } from "zod";

// Schémas de domaine partagés (client + serveur). Servent notamment à valider
// la sortie de la génération IA avant insertion en base. Voir docs/data-model.md.

export const questionTypeSchema = z.enum([
  "SHORT_TEXT",
  "LONG_TEXT",
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "RATING",
  "NUMBER",
  "EMAIL",
  "DATE",
]);
export type QuestionType = z.infer<typeof questionTypeSchema>;

export const generatedQuestionSchema = z.object({
  label: z.string().min(1),
  type: questionTypeSchema,
  required: z.boolean().default(false),
  options: z.array(z.string().min(1)).optional(),
});

export const generatedFormSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(generatedQuestionSchema).min(1),
});
export type GeneratedForm = z.infer<typeof generatedFormSchema>;
