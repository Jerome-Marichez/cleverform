import { z } from "zod";

// Schémas d'ENTRÉE de l'assistance IA (côté admin) : prompt de génération et
// texte à corriger. Distincts des schémas de SORTIE IA (`form.ts`).
// Voir docs/security.md (validation des entrées) et docs/architecture.md.

/** Corps de `POST /api/admin/ai/generate` : un sujet libre non vide. */
export const aiGenerateSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, { error: "Le sujet du questionnaire est requis." })
    .max(2000, { error: "Le sujet est trop long (2000 caractères maximum)." }),
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
