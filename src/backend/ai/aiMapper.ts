// Transformations et règles PURES de la couche IA.
//
// Ce module ne dépend NI de Prisma NI du réseau : il ne manipule que des objets
// simples et les schémas Zod partagés. Toute la logique exploitable de
// l'assistance IA — extraction du JSON de la réponse, validation, mapping vers
// le schéma de création, nettoyage du texte corrigé — vit ici, isolée de
// l'orchestration (`aiService.ts`) et de l'appel réseau (`aiClient.ts`).
//
// C'est ce qui rend cette logique vérifiable par des tests unitaires SANS clé
// API, SANS réseau et SANS base de données (voir docs/testing.md) : importer ce
// module ne déclenche aucune connexion Prisma.

import {
  generatedFormSchema,
  type CreateFormInput,
  type GeneratedForm,
} from "@/shared/schemas";
import { isChoiceQuestionType } from "@/shared/schemas/formInput";

import { AiGenerationError } from "@/backend/ai/aiErrors";

/**
 * Extrait le premier objet JSON présent dans un texte. Tolère :
 *  - une réponse JSON nue ;
 *  - une réponse encadrée par des fences Markdown ```json … ``` (ou ``` … ```) ;
 *  - du texte parasite avant/après l'objet (on isole `{ … }`).
 * Renvoie la sous-chaîne JSON, ou `null` si aucun objet n'est détectable.
 */
function extractJsonText(raw: string): string | null {
  const trimmed = raw.trim();

  // 1) Bloc de code Markdown : on récupère le contenu entre fences.
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = (fenceMatch ? fenceMatch[1] : trimmed).trim();

  // 2) On isole le premier objet `{ … }` (du premier `{` au dernier `}`).
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return candidate.slice(start, end + 1);
}

/**
 * Extrait et valide un questionnaire généré depuis le texte brut renvoyé par
 * l'IA. Fonction PURE.
 *
 * @throws AiGenerationError si aucun JSON exploitable n'est trouvé, si le JSON
 *         est invalide, ou s'il ne respecte pas `generatedFormSchema`.
 */
export function extractGeneratedForm(rawText: string): GeneratedForm {
  const jsonText = extractJsonText(rawText);
  if (jsonText === null) {
    throw new AiGenerationError(
      "La réponse de l'IA ne contient aucun JSON exploitable.",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (cause) {
    throw new AiGenerationError(
      "La réponse de l'IA n'est pas un JSON valide.",
      cause,
    );
  }

  const result = generatedFormSchema.safeParse(parsed);
  if (!result.success) {
    throw new AiGenerationError(
      "La structure du questionnaire généré est invalide.",
      result.error,
    );
  }
  return result.data;
}

/**
 * Convertit un questionnaire généré (`GeneratedForm`) en entrée de création
 * (`CreateFormInput`). Fonction PURE :
 *  - attribue un `order` séquentiel aux questions et aux options ;
 *  - transforme `options: string[]` en objets `{ label, order }` ;
 *  - ne conserve les options que pour les types à choix (par cohérence avec
 *    `questionInputSchema`, qui rejette des options sur un type sans choix).
 */
export function toCreateFormInput(generated: GeneratedForm): CreateFormInput {
  return {
    title: generated.title,
    ...(generated.description ? { description: generated.description } : {}),
    questions: generated.questions.map((question, index) => ({
      label: question.label,
      type: question.type,
      required: question.required,
      order: index,
      options: isChoiceQuestionType(question.type)
        ? (question.options ?? []).map((label, optionIndex) => ({
            label,
            order: optionIndex,
          }))
        : [],
    })),
  };
}

/**
 * Nettoie le texte corrigé renvoyé par l'IA. Fonction PURE :
 *  - rogne les espaces de début/fin ;
 *  - retire une éventuelle paire de guillemets droits/typographiques entourant
 *    tout le texte (le modèle ajoute parfois des guillemets malgré la consigne).
 */
export function cleanProofreadOutput(raw: string): string {
  let text = raw.trim();

  const quotePairs: ReadonlyArray<readonly [string, string]> = [
    ['"', '"'],
    ["'", "'"],
    ["«", "»"],
    ["“", "”"],
  ];
  for (const [open, close] of quotePairs) {
    if (text.length >= 2 && text.startsWith(open) && text.endsWith(close)) {
      text = text.slice(open.length, text.length - close.length).trim();
      break;
    }
  }

  return text;
}
