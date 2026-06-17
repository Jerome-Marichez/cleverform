// Service IA — orchestration de l'assistance par IA (génération + correction).
//
// Ce module se concentre sur l'ORCHESTRATION (`generateForm`, `proofread`) : il
// appelle la couche réseau fine `aiClient.callClaude`, applique la logique PURE
// fournie par `aiMapper.ts` (extraction / validation / mapping / nettoyage),
// puis persiste via `formService.createForm`.
//
// La séparation est volontaire et load-bearing pour les tests : la logique pure
// vit dans `aiMapper.ts`, qui NE dépend NI de Prisma NI du réseau ; les tests
// unitaires l'importent directement, sans déclencher la connexion DB que ce
// module-ci tire transitivement (`formService` → `formRepository` → `db`).
// L'appel réseau reste isolé dans `aiClient.ts` (non testé unitairement).

import { callClaude } from "@/backend/ai/aiClient";
import { AiGenerationError } from "@/backend/ai/aiErrors";
import {
  extractGeneratedForm,
  cleanProofreadOutput,
  toCreateFormInput,
} from "@/backend/ai/aiMapper";
import { createForm } from "@/backend/form/formService";
import type { FormWithRelations } from "@/backend/form/formRepository";

// --- Prompts système --------------------------------------------------------

/** Liste des types de question autorisés, pour cadrer la sortie de l'IA. */
const QUESTION_TYPES = [
  "SHORT_TEXT",
  "LONG_TEXT",
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "RATING",
  "NUMBER",
  "EMAIL",
  "DATE",
].join(", ");

/** Prompt système strict pour la génération d'un questionnaire. */
const GENERATE_SYSTEM_PROMPT = [
  "Tu es un assistant qui conçoit des questionnaires (type Typeform).",
  "À partir du sujet fourni par l'utilisateur, génère un questionnaire pertinent en français.",
  "Réponds UNIQUEMENT par un objet JSON valide, sans texte autour ni bloc de code Markdown.",
  "Schéma EXACT attendu :",
  '{ "title": string, "description"?: string, "questions": [ { "label": string, "type": string, "required": boolean, "options"?: string[] } ] }',
  `Le champ "type" doit valoir l'une de ces valeurs exactes : ${QUESTION_TYPES}.`,
  "Génère entre 4 et 8 questions pertinentes, avec des types variés et adaptés au sujet.",
  'Ne fournis "options" (liste non vide de chaînes) que pour les types SINGLE_CHOICE et MULTIPLE_CHOICE ; pour les autres types, omets "options".',
  "Les libellés sont des phrases claires et concises, en français.",
].join("\n");

/** Prompt système pour la correction orthographique et grammaticale. */
const PROOFREAD_SYSTEM_PROMPT = [
  "Tu es un correcteur orthographique et grammatical en français.",
  "Corrige l'orthographe et la grammaire du texte fourni, en préservant son sens et son intention.",
  "Renvoie UNIQUEMENT le texte corrigé, sans guillemets, sans préambule ni commentaire.",
].join("\n");

// --- Orchestration (réseau) -------------------------------------------------

/**
 * Génère un questionnaire à partir d'un prompt libre, puis le persiste.
 *
 * Stratégie de robustesse : on appelle l'IA, on tente l'extraction/validation ;
 * en cas d'échec, on RÉESSAIE UNE FOIS (les modèles renvoient parfois un format
 * imparfait au premier essai). Si le second essai échoue aussi, l'erreur
 * `AiGenerationError` est propagée (traduite en 502 par la route).
 *
 * @param prompt  sujet libre fourni par l'administrateur.
 * @throws AiGenerationError si la sortie reste inexploitable après le retry.
 */
export async function generateForm(prompt: string): Promise<FormWithRelations> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const rawText = await callClaude(GENERATE_SYSTEM_PROMPT, prompt);
    try {
      const generated = extractGeneratedForm(rawText);
      const input = toCreateFormInput(generated);
      return await createForm(input, {
        generatedByAi: true,
        aiPrompt: prompt,
      });
    } catch (error) {
      // On ne réessaie que sur un format inexploitable ; toute autre erreur
      // (ex. persistance) est immédiatement propagée.
      if (!(error instanceof AiGenerationError)) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError instanceof AiGenerationError
    ? lastError
    : new AiGenerationError("La génération du questionnaire a échoué.");
}

/**
 * Corrige l'orthographe et la grammaire d'un texte (libellé, titre…).
 * Renvoie le texte corrigé et nettoyé.
 *
 * @param text  texte à corriger.
 */
export async function proofread(text: string): Promise<string> {
  const rawText = await callClaude(PROOFREAD_SYSTEM_PROMPT, text);
  return cleanProofreadOutput(rawText);
}
