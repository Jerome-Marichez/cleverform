import { db } from "@/backend/db";
import { type AnswerInput } from "@/shared/schemas";

// Couche d'accès aux données (Prisma) pour le domaine « Response ».
//
// Ce module est la SEULE porte vers la base concernant les réponses : il isole
// les requêtes Prisma (et leurs `include`/`select`) du reste du métier. La
// logique pure (mapping DTO, agrégation, validation) vit dans
// `responseMapper.ts` / `responseService.ts` et reste testable sans base.

// --- Types de retour (formes Prisma chargées) -------------------------------
//
// On dérive les types directement des requêtes Prisma (via `Awaited<ReturnType>`)
// afin que les fonctions pures consommatrices restent fidèles à ce qui est
// réellement chargé (questions/options ordonnées, options sélectionnées…).

/** `Form` publié chargé avec ses questions et options ordonnées. */
export type PublishedFormWithQuestions = NonNullable<
  Awaited<ReturnType<typeof findPublishedFormByPublicId>>
>;

/** Une `Response` chargée avec ses `Answer` et leurs options sélectionnées. */
export type ResponseWithAnswers = Awaited<
  ReturnType<typeof findResponsesByFormId>
>[number];

/**
 * Charge un `Form` **publié** par son `publicId`, avec ses questions et leurs
 * options, le tout **ordonné** (par `order`). Renvoie `null` si aucun `Form`
 * publié ne correspond (inexistant ou non `PUBLISHED`).
 *
 * Le filtre `status: "PUBLISHED"` est appliqué côté requête : un brouillon ou un
 * questionnaire clos est invisible publiquement (voir docs/security.md).
 */
export function findPublishedFormByPublicId(publicId: string) {
  return db.form.findFirst({
    where: { publicId, status: "PUBLISHED" },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: {
          options: { orderBy: { order: "asc" } },
        },
      },
    },
  });
}

/**
 * Persiste une soumission : crée la `Response` rattachée au `Form` (par son `id`
 * interne) et toutes ses `Answer`. Pour chaque réponse :
 *  - `value` porte la réponse scalaire (texte, nombre, e-mail, date, note) ;
 *  - `selectedOptionIds` connecte les `Option` choisies (relation many-to-many).
 *
 * La création est imbriquée (nested write) : Prisma l'exécute dans une seule
 * transaction implicite — `Response` et `Answer` sont écrits atomiquement.
 */
export function insertResponse(formId: string, answers: AnswerInput[]) {
  return db.response.create({
    data: {
      formId,
      answers: {
        create: answers.map((answer) => ({
          questionId: answer.questionId,
          value: answer.value ?? null,
          selectedOptions:
            answer.selectedOptionIds && answer.selectedOptionIds.length > 0
              ? { connect: answer.selectedOptionIds.map((id) => ({ id })) }
              : undefined,
        })),
      },
    },
    select: { id: true, submittedAt: true },
  });
}

/**
 * Charge un `Form` par son `id` interne (tous statuts), avec ses questions et
 * options ordonnées. Base de l'agrégation admin (le Response Viewer consulte
 * aussi les réponses d'un formulaire clos). Renvoie `null` si introuvable.
 */
export function findFormById(formId: string) {
  return db.form.findUnique({
    where: { id: formId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });
}

/**
 * Charge toutes les `Response` d'un `Form` (par son `id` interne), avec leurs
 * `Answer` et les options sélectionnées. Réservé à l'espace admin (Response
 * Viewer) — le public ne lit jamais les réponses.
 */
export function findResponsesByFormId(formId: string) {
  return db.response.findMany({
    where: { formId },
    orderBy: { submittedAt: "asc" },
    include: {
      answers: {
        include: {
          selectedOptions: { select: { id: true, label: true, order: true } },
        },
      },
    },
  });
}
