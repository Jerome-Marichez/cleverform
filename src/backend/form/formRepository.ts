// Accès aux données de la couche Form (Prisma uniquement).
//
// Cette couche ne contient AUCUNE règle métier : elle traduit des intentions
// déjà validées/transformées (par `formService` + `formMapper`) en requêtes
// Prisma. Elle n'est volontairement pas couverte par des tests unitaires (elle
// suppose une base réelle) ; sa correction est vérifiée par les tests système.

import { db } from "@/backend/db";

import type {
  FormCreateData,
  FormScalarUpdate,
  QuestionCreateData,
} from "@/backend/form/formMapper";

// Inclusion standard : questions + options, toujours triées par `order`.
// Centralisée pour que toutes les lectures renvoient la même forme.
const formInclude = {
  questions: {
    orderBy: { order: "asc" },
    include: {
      options: {
        orderBy: { order: "asc" },
      },
    },
  },
} as const;

/** Form complet tel que renvoyé par le repository (questions + options triées). */
export type FormWithRelations = NonNullable<
  Awaited<ReturnType<typeof findFormById>>
>;

/** Insère un nouveau questionnaire avec ses questions/options imbriquées. */
export function insertForm(data: FormCreateData) {
  return db.form.create({
    data,
    include: formInclude,
  });
}

/** Liste les questionnaires (les plus récents d'abord), avec leurs questions. */
export function findForms() {
  return db.form.findMany({
    orderBy: { createdAt: "desc" },
    include: formInclude,
  });
}

/** Récupère un questionnaire par sa clé interne, ou `null` s'il n'existe pas. */
export function findFormById(id: string) {
  return db.form.findUnique({
    where: { id },
    include: formInclude,
  });
}

/** Récupère uniquement le statut courant d'un questionnaire (pour les règles). */
export function findFormStatus(id: string) {
  return db.form.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
}

/**
 * Met à jour un questionnaire. Les champs scalaires sont appliqués directement.
 * Si `questions` est fourni, on remplace l'intégralité des questions (suppression
 * en cascade puis recréation) dans une **transaction** pour rester atomique :
 * c'est le moyen le plus simple et robuste de gérer ajouts/suppressions/réordres
 * sans réconciliation fine. `questions === null` laisse les questions inchangées.
 */
export function updateFormRecord(
  id: string,
  scalar: FormScalarUpdate,
  questions: QuestionCreateData[] | null,
) {
  if (questions === null) {
    return db.form.update({
      where: { id },
      data: scalar,
      include: formInclude,
    });
  }

  return db.$transaction(async (tx) => {
    // Suppression des questions existantes (les options partent en cascade).
    await tx.question.deleteMany({ where: { formId: id } });

    return tx.form.update({
      where: { id },
      data: {
        ...scalar,
        questions: { create: questions },
      },
      include: formInclude,
    });
  });
}

/** Change le statut d'un questionnaire (publication / clôture). */
export function setFormStatus(id: string, status: FormScalarUpdate["status"]) {
  return db.form.update({
    where: { id },
    data: { status },
    include: formInclude,
  });
}

/** Supprime un questionnaire (questions/options/réponses partent en cascade). */
export function deleteFormById(id: string) {
  return db.form.delete({ where: { id } });
}
