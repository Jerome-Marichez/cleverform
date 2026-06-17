import { z } from "zod";

import { questionTypeSchema, type QuestionType } from "@/shared/schemas/form";

// Schémas de SOUMISSION publique (Form Responder) : une `Response` est une liste
// de réponses, une par question. La validation se fait en deux temps :
//
//  1. `submitResponseSchema` valide la **forme** brute de la soumission
//     (structure : questionId + value? / selectedOptionIds?), sans connaître la
//     définition du questionnaire.
//  2. `validateAnswerForType` applique les **règles métier par type** de question
//     (texte requis non vide, format email, nombre, date, cardinalité des choix).
//     Cette seconde passe a besoin de la définition (type + required) que seul le
//     backend détient ; elle est donc exposée comme fonction utilitaire pure.
//
// Voir docs/data-model.md (section « Règles de validation par type »).

// --- Forme brute d'une soumission ------------------------------------------

// Une réponse porte au plus l'un des deux supports :
//  - `value`            : réponse scalaire (texte, nombre, email, date, note) ;
//  - `selectedOptionIds`: identifiants des options choisies (types à choix).
export const answerInputSchema = z.object({
  questionId: z
    .string()
    .min(1, { error: "L'identifiant de la question est requis." }),
  value: z.string().optional(),
  selectedOptionIds: z.array(z.string().min(1)).optional(),
});
export type AnswerInput = z.infer<typeof answerInputSchema>;

export const submitResponseSchema = z.object({
  answers: z
    .array(answerInputSchema)
    .min(1, { error: "Une soumission doit comporter au moins une réponse." }),
});
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;

// --- Règles de validation par type -----------------------------------------

/** Résultat d'une validation de réponse vis-à-vis du type de sa question. */
export type AnswerValidationResult =
  | { valid: true }
  | { valid: false; error: string };

const VALID = { valid: true } as const;
const invalid = (error: string): AnswerValidationResult => ({ valid: false, error });

/** Une réponse est-elle « vide » (aucune valeur scalaire ni option) ? */
function isAnswerEmpty(answer: AnswerInput): boolean {
  const hasValue = typeof answer.value === "string" && answer.value.trim().length > 0;
  const hasOptions =
    Array.isArray(answer.selectedOptionIds) && answer.selectedOptionIds.length > 0;
  return !hasValue && !hasOptions;
}

// Regex e-mail volontairement simple et stable (un seul `@`, un point dans le
// domaine). On reste permissif côté forme : la vérité d'un e-mail se prouve par
// envoi, pas par une regex exhaustive.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valide une réponse (`AnswerInput`) au regard du **type** de sa question et de
 * son caractère **obligatoire**. Fonction pure (aucune dépendance framework),
 * réutilisable côté backend lors de la soumission.
 *
 * Contrat par type :
 *  - champ **non requis** laissé vide        → accepté (court-circuit) ;
 *  - SHORT_TEXT / LONG_TEXT (requis)          → `value` non vide ;
 *  - EMAIL                                    → `value` au format e-mail ;
 *  - NUMBER                                   → `value` convertible en nombre fini ;
 *  - RATING                                   → `value` entier >= 0 ;
 *  - DATE                                     → `value` date valide (Date.parse) ;
 *  - SINGLE_CHOICE                            → exactement 1 option sélectionnée ;
 *  - MULTIPLE_CHOICE (requis)                 → au moins 1 option sélectionnée.
 */
export function validateAnswerForType(
  type: QuestionType,
  answer: AnswerInput,
  required: boolean,
): AnswerValidationResult {
  const empty = isAnswerEmpty(answer);

  // Une question obligatoire ne peut pas rester vide ; une question facultative
  // laissée vide est toujours acceptée (court-circuit).
  if (empty) {
    return required ? invalid("Cette question est obligatoire.") : VALID;
  }

  const value = answer.value?.trim() ?? "";
  const selected = answer.selectedOptionIds ?? [];

  switch (type) {
    case "SHORT_TEXT":
    case "LONG_TEXT":
      // Le caractère « non vide » est déjà couvert par `empty` ci-dessus.
      return VALID;

    case "EMAIL":
      return EMAIL_REGEX.test(value)
        ? VALID
        : invalid("L'adresse e-mail n'est pas valide.");

    case "NUMBER": {
      const parsed = Number(value);
      return Number.isFinite(parsed)
        ? VALID
        : invalid("La réponse doit être un nombre.");
    }

    case "RATING": {
      const parsed = Number(value);
      return Number.isInteger(parsed) && parsed >= 0
        ? VALID
        : invalid("La note doit être un entier positif.");
    }

    case "DATE":
      return !Number.isNaN(Date.parse(value))
        ? VALID
        : invalid("La date n'est pas valide.");

    case "SINGLE_CHOICE":
      return selected.length === 1
        ? VALID
        : invalid("Vous devez sélectionner exactement une option.");

    case "MULTIPLE_CHOICE":
      // `empty` garantit déjà >= 1 option ici.
      return selected.length >= 1
        ? VALID
        : invalid("Vous devez sélectionner au moins une option.");

    default: {
      // Exhaustivité : tout nouveau type doit être traité explicitement.
      const _exhaustiveCheck: never = type;
      return invalid(`Type de question inconnu : ${String(_exhaustiveCheck)}.`);
    }
  }
}

/**
 * Fabrique un schéma Zod paramétré par la **définition** des questions, pour
 * valider une soumission complète en une passe (forme + règles par type).
 * Pratique côté backend une fois le `Form` chargé.
 *
 * @param questions définitions { id, type, required } des questions du `Form`.
 */
export function buildSubmitResponseSchema(
  questions: ReadonlyArray<{ id: string; type: QuestionType; required: boolean }>,
) {
  const byId = new Map(questions.map((q) => [q.id, q]));

  return submitResponseSchema.superRefine((submission, ctx) => {
    submission.answers.forEach((answer, index) => {
      const question = byId.get(answer.questionId);

      if (!question) {
        ctx.addIssue({
          code: "custom",
          path: ["answers", index, "questionId"],
          message: "La question référencée n'existe pas dans ce questionnaire.",
        });
        return;
      }

      const result = validateAnswerForType(question.type, answer, question.required);
      if (!result.valid) {
        ctx.addIssue({
          code: "custom",
          path: ["answers", index],
          message: result.error,
        });
      }
    });

    // Toute question obligatoire doit recevoir une réponse.
    const answeredIds = new Set(submission.answers.map((a) => a.questionId));
    for (const question of questions) {
      if (question.required && !answeredIds.has(question.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["answers"],
          message: "Une question obligatoire n'a pas de réponse.",
        });
      }
    }
  });
}

// Réexport pour cohérence des imports.
export { questionTypeSchema };
