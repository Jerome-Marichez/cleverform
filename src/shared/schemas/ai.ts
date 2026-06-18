import { z } from "zod";

// Schémas d'ENTRÉE de l'assistance IA (côté admin) : prompt de génération et
// texte à corriger. Distincts des schémas de SORTIE IA (`form.ts`).
// Voir docs/security.md (validation des entrées) et docs/architecture.md.

/**
 * Longueur maximale du prompt de génération (en caractères).
 *
 * Borne **load-bearing pour le coût** : elle plafonne les tokens d'ENTRÉE d'un
 * appel de génération, donc le coût maximal et déterministe d'une génération
 * (cf. docs/architecture.md, § « Couche IA »). Source unique, réutilisée par la
 * validation serveur (ci-dessous) ET par la borne du champ côté UI
 * (`GenerateWithAiDialog`), pour que la limite soit appliquée réellement et de
 * façon cohérente front/back.
 */
export const MAX_AI_PROMPT_LENGTH = 1000;

/** Corps de `POST /api/admin/ai/generate` : un sujet libre non vide et borné. */
export const aiGenerateSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, { error: "Le sujet du questionnaire est requis." })
    .max(MAX_AI_PROMPT_LENGTH, {
      error: `Le sujet est trop long (${MAX_AI_PROMPT_LENGTH} caractères maximum).`,
    }),
});
export type AiGenerateInput = z.infer<typeof aiGenerateSchema>;

/** Corps de `POST /api/admin/ai/proofread` : un texte à corriger non vide. */
export const aiProofreadSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, { error: "Le texte à corriger est requis." })
    .max(2000, { error: "Le texte est trop long (2000 caractères maximum)." }),
});
export type AiProofreadInput = z.infer<typeof aiProofreadSchema>;
