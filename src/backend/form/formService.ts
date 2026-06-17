// Service Form — orchestration métier des questionnaires (côté admin).
//
// Rôle de cette couche :
//  1. valider les entrées via les schémas partagés (`@/shared/schemas`) ;
//  2. appliquer les transformations/règles PURES (`formMapper`) ;
//  3. déléguer l'accès aux données au repository (`formRepository`) ;
//  4. lever des erreurs métier typées (`formErrors`) que les routes traduisent
//     en codes HTTP.
//
// Les entrées arrivent ici NON validées (objets bruts venant des routes) : la
// validation Zod est centralisée dans le service, pas dans les Route Handlers.

import {
  createFormSchema,
  formStatusSchema,
  updateFormSchema,
  type FormStatus,
} from "@/shared/schemas";

import {
  FormNotFoundError,
  InvalidStatusTransitionError,
} from "@/backend/form/formErrors";
import {
  canTransition,
  toCreateData,
  toQuestionsReplacement,
  toScalarUpdate,
  type FormOrigin,
} from "@/backend/form/formMapper";
import {
  deleteFormById,
  findFormById,
  findForms,
  findFormStatus,
  insertForm,
  setFormStatus,
  updateFormRecord,
  type FormWithRelations,
} from "@/backend/form/formRepository";

/**
 * Crée un questionnaire à partir d'une entrée brute.
 * @param input    données du formulaire (validées par `createFormSchema`).
 * @param origin   provenance optionnelle (création assistée par IA).
 * @throws ZodError si l'entrée est invalide.
 */
export function createForm(
  input: unknown,
  origin: FormOrigin = {},
): Promise<FormWithRelations> {
  const parsed = createFormSchema.parse(input);
  return insertForm(toCreateData(parsed, origin));
}

/** Liste tous les questionnaires (les plus récents d'abord). */
export function listForms(): Promise<FormWithRelations[]> {
  return findForms();
}

/**
 * Récupère un questionnaire par sa clé interne.
 * @throws FormNotFoundError si aucun questionnaire ne correspond.
 */
export async function getForm(id: string): Promise<FormWithRelations> {
  const form = await findFormById(id);
  if (!form) {
    throw new FormNotFoundError(id);
  }
  return form;
}

/**
 * Met à jour un questionnaire (champs scalaires et/ou remplacement des questions).
 * @throws ZodError        si l'entrée est invalide.
 * @throws FormNotFoundError si le questionnaire n'existe pas.
 */
export async function updateForm(
  id: string,
  input: unknown,
): Promise<FormWithRelations> {
  const parsed = updateFormSchema.parse(input);

  const existing = await findFormStatus(id);
  if (!existing) {
    throw new FormNotFoundError(id);
  }

  // Un changement de statut via PATCH doit respecter les transitions autorisées.
  if (parsed.status !== undefined && parsed.status !== existing.status) {
    if (!canTransition(existing.status, parsed.status)) {
      throw new InvalidStatusTransitionError(existing.status, parsed.status);
    }
  }

  return updateFormRecord(
    id,
    toScalarUpdate(parsed),
    toQuestionsReplacement(parsed),
  );
}

/**
 * Applique une transition de statut explicite (route de publication).
 * @throws ZodError                   si le statut cible est invalide.
 * @throws FormNotFoundError          si le questionnaire n'existe pas.
 * @throws InvalidStatusTransitionError si la transition n'est pas autorisée.
 */
export async function changeFormStatus(
  id: string,
  targetStatus: unknown,
): Promise<FormWithRelations> {
  const status: FormStatus = formStatusSchema.parse(targetStatus);

  const existing = await findFormStatus(id);
  if (!existing) {
    throw new FormNotFoundError(id);
  }

  // Idempotence : viser le statut courant ne fait rien d'illégal.
  if (existing.status === status) {
    return getForm(id);
  }

  if (!canTransition(existing.status, status)) {
    throw new InvalidStatusTransitionError(existing.status, status);
  }

  return setFormStatus(id, status);
}

/** Publie un questionnaire (DRAFT → PUBLISHED). */
export function publishForm(id: string): Promise<FormWithRelations> {
  return changeFormStatus(id, "PUBLISHED");
}

/** Clôture un questionnaire (PUBLISHED → CLOSED). */
export function closeForm(id: string): Promise<FormWithRelations> {
  return changeFormStatus(id, "CLOSED");
}

/**
 * Supprime un questionnaire (et ses dépendances en cascade).
 * @throws FormNotFoundError si le questionnaire n'existe pas.
 */
export async function deleteForm(id: string): Promise<void> {
  const existing = await findFormStatus(id);
  if (!existing) {
    throw new FormNotFoundError(id);
  }
  await deleteFormById(id);
}
