import { type FormStatus, type QuestionType } from "@/shared/schemas/form";

// DTO **publics** servis au Form Responder (`/f/[publicId]`).
//
// Frontière de sécurité (voir docs/security.md & data-model.md) :
//  - l'`id` interne du `Form` n'est JAMAIS exposé : seul `publicId` l'est ;
//  - on n'expose que ce qui est nécessaire au remplissage (libellés, types,
//    caractère obligatoire, options) — ni réponses d'autrui, ni champs admin
//    (`aiPrompt`, `generatedByAi`, timestamps, `formId`…).
//
// Ce sont des **types** (pas des schémas Zod) : ils décrivent la SORTIE du
// backend vers le public, validée à la source, pas une entrée à parser.

/** Une option de choix exposée au public (sans `questionId`). */
export interface PublicOption {
  id: string;
  label: string;
  order: number;
}

/** Une question exposée au public (sans `formId`). */
export interface PublicQuestion {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  order: number;
  options: PublicOption[];
}

/**
 * Définition publique d'un questionnaire **publié**, identifié par son seul
 * `publicId`. N'inclut volontairement pas l'`id` interne.
 */
export interface PublicForm {
  publicId: string;
  title: string;
  description: string | null;
  status: Extract<FormStatus, "PUBLISHED">;
  questions: PublicQuestion[];
}
