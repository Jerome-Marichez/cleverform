import {
  findFormById,
  findPublishedFormByPublicId,
  findResponsesByFormId,
  insertResponse,
} from "@/backend/response/responseRepository";
import {
  aggregateResponses,
  toPublicForm,
  type ResponsesAggregate,
} from "@/backend/response/responseMapper";
import {
  buildSubmitResponseSchema,
  type PublicForm,
  type SubmitResponseInput,
} from "@/shared/schemas";

// Services (use-cases) du domaine « Response ». Orchestrent le repository
// (accès base) et la logique pure (mapper, validation Zod). Les erreurs métier
// sont **typées** afin que les Route Handlers les traduisent en statuts HTTP
// (404 / 400) sans inspecter de messages.

// --- Erreurs typées ---------------------------------------------------------

/** Aucun `Form` ne correspond au `publicId` fourni → 404 public. */
export class FormNotFoundError extends Error {
  constructor(publicId: string) {
    super(`Aucun questionnaire ne correspond à l'identifiant « ${publicId} ».`);
    this.name = "FormNotFoundError";
  }
}

/**
 * Un `Form` existe mais n'est pas `PUBLISHED` (brouillon ou clos). Côté public,
 * indiscernable d'un formulaire inexistant : les deux donnent un 404 (on ne
 * révèle pas l'existence d'un brouillon). Conservée distincte pour la lisibilité
 * et d'éventuels logs internes.
 */
export class FormNotPublishedError extends Error {
  constructor(publicId: string) {
    super(`Le questionnaire « ${publicId} » n'est pas publié.`);
    this.name = "FormNotPublishedError";
  }
}

/** Soumission invalide (forme ou règles par type). Porte le détail Zod aplati. */
export class InvalidSubmissionError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super("La soumission est invalide.");
    this.name = "InvalidSubmissionError";
    this.issues = issues;
  }
}

// --- Use-cases --------------------------------------------------------------

/**
 * Récupère le DTO **public** d'un questionnaire publié.
 *
 * Le repository ne renvoie qu'un `Form` `PUBLISHED` : tout autre cas (inexistant,
 * brouillon, clos) remonte ici comme `null` et lève `FormNotFoundError` — ce qui
 * se traduit par un 404 public, sans divulguer la cause exacte.
 */
export async function getPublicForm(publicId: string): Promise<PublicForm> {
  const form = await findPublishedFormByPublicId(publicId);
  if (!form) {
    throw new FormNotFoundError(publicId);
  }
  return toPublicForm(form);
}

/**
 * Enregistre une soumission de réponses sur un questionnaire publié.
 *
 * Étapes :
 *  1. charge le `Form` publié (404 sinon) ;
 *  2. valide l'entrée via `buildSubmitResponseSchema(questions)` — forme brute,
 *     règles par type, présence des questions obligatoires, rejet des
 *     `questionId` inconnus ;
 *  3. persiste `Response` + `Answer` (connexion des options choisies).
 *
 * @returns identifiant et horodatage de la `Response` créée.
 */
export async function submitResponse(
  publicId: string,
  input: SubmitResponseInput,
): Promise<{ id: string; submittedAt: Date }> {
  const form = await findPublishedFormByPublicId(publicId);
  if (!form) {
    throw new FormNotFoundError(publicId);
  }

  const schema = buildSubmitResponseSchema(form.questions);
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message);
    throw new InvalidSubmissionError(issues);
  }

  return insertResponse(form.id, parsed.data.answers);
}

/**
 * Liste brute des réponses d'un questionnaire (par `id` interne). Réservé à
 * l'espace admin (Response Viewer). Renvoie les soumissions avec leurs réponses
 * et options sélectionnées, triées par date de soumission.
 */
export function listResponses(formId: string) {
  return findResponsesByFormId(formId);
}

/**
 * Agrège les réponses d'un questionnaire pour le Response Viewer (compteurs par
 * option, moyenne des notes, valeurs textuelles), par `id` interne. Renvoie
 * `null` si le questionnaire n'existe pas.
 */
export async function getFormResponsesAggregated(
  formId: string,
): Promise<ResponsesAggregate | null> {
  const form = await findFormById(formId);
  if (!form) {
    return null;
  }
  const responses = await findResponsesByFormId(formId);
  return aggregateResponses(form, responses);
}
