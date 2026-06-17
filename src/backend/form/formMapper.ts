// Transformations et règles métier PURES de la couche Form.
//
// Ce module ne dépend NI de Prisma NI du réseau : il ne manipule que des objets
// simples. Toute la logique testable (attribution des `order`, construction de la
// forme de création imbriquée, règles de transition de statut, réordonnancement)
// vit ici, isolée de l'accès aux données (`formRepository.ts`). C'est ce qui rend
// la couche métier vérifiable par des tests unitaires sans base de données.

import type {
  CreateFormInput,
  FormStatus,
  UpdateFormInput,
} from "@/shared/schemas";

// --- Formes de création (compatibles Prisma `create` imbriqué) --------------
//
// On décrit volontairement des types « simples » (sans dépendre des types Prisma
// générés) : ils correspondent à la forme attendue par `db.form.create({ data })`
// avec création imbriquée des questions et de leurs options. Le repository les
// passe tels quels à Prisma, qui les accepte structurellement.

/** Option prête à insérer : libellé + position. */
export interface OptionCreateData {
  label: string;
  order: number;
}

/** Question prête à insérer (avec ses options imbriquées). */
export interface QuestionCreateData {
  label: string;
  type: CreateFormInput["questions"][number]["type"];
  required: boolean;
  order: number;
  options: { create: OptionCreateData[] };
}

/** Form prêt à insérer (avec ses questions imbriquées). */
export interface FormCreateData {
  title: string;
  description: string | null;
  generatedByAi: boolean;
  aiPrompt: string | null;
  questions: { create: QuestionCreateData[] };
}

/** Options de provenance (création IA) appliquées à la donnée de création. */
export interface FormOrigin {
  generatedByAi?: boolean;
  aiPrompt?: string | null;
}

// --- Attribution des positions (`order`) ------------------------------------

/**
 * Réindexe une liste de questions/options : la position (`order`) est dérivée de
 * l'**ordre du tableau** (0, 1, 2, …), et non de la valeur `order` reçue. Cela
 * garantit une numérotation dense et cohérente quelle que soit l'entrée.
 */
function withSequentialOrder<T>(items: readonly T[]): Array<T & { order: number }> {
  return items.map((item, index) => ({ ...item, order: index }));
}

// --- Création ---------------------------------------------------------------

/**
 * Transforme une entrée validée (`CreateFormInput`) en données de création
 * imbriquées Prisma. Fonction PURE :
 *  - normalise `description` absente en `null` ;
 *  - réattribue les `order` des questions et de leurs options selon leur position
 *    dans les tableaux (numérotation dense 0..n) ;
 *  - applique la provenance (création IA) le cas échéant.
 */
export function toCreateData(
  input: CreateFormInput,
  origin: FormOrigin = {},
): FormCreateData {
  const questions = withSequentialOrder(input.questions).map((question) => ({
    label: question.label,
    type: question.type,
    required: question.required,
    order: question.order,
    options: {
      create: withSequentialOrder(question.options ?? []).map((option) => ({
        label: option.label,
        order: option.order,
      })),
    },
  }));

  return {
    title: input.title,
    description: input.description ?? null,
    generatedByAi: origin.generatedByAi ?? false,
    aiPrompt: origin.aiPrompt ?? null,
    questions: { create: questions },
  };
}

// --- Mise à jour ------------------------------------------------------------

/** Champs scalaires du Form modifiables par une mise à jour. */
export interface FormScalarUpdate {
  title?: string;
  description?: string | null;
  status?: FormStatus;
}

/**
 * Extrait de l'entrée de mise à jour la part **scalaire** (titre, description,
 * statut), sans toucher aux questions (remplacées séparément par le repository,
 * car une mise à jour imbriquée suppose de supprimer puis recréer les questions).
 * Fonction PURE.
 */
export function toScalarUpdate(input: UpdateFormInput): FormScalarUpdate {
  const update: FormScalarUpdate = {};
  if (input.title !== undefined) {
    update.title = input.title;
  }
  if (input.description !== undefined) {
    update.description = input.description;
  }
  if (input.status !== undefined) {
    update.status = input.status;
  }
  return update;
}

/**
 * Construit la liste de questions à recréer lors d'une mise à jour, avec leurs
 * `order` réattribués (numérotation dense). Renvoie `null` si l'entrée ne touche
 * pas aux questions (elles sont alors laissées inchangées). Fonction PURE.
 */
export function toQuestionsReplacement(
  input: UpdateFormInput,
): QuestionCreateData[] | null {
  if (input.questions === undefined) {
    return null;
  }
  return withSequentialOrder(input.questions).map((question) => ({
    label: question.label,
    type: question.type,
    required: question.required,
    order: question.order,
    options: {
      create: withSequentialOrder(question.options ?? []).map((option) => ({
        label: option.label,
        order: option.order,
      })),
    },
  }));
}

// --- Règles de transition de statut -----------------------------------------
//
// Cycle de vie d'un questionnaire :
//   DRAFT  ──publish──▶  PUBLISHED  ──close──▶  CLOSED
// La publication n'est possible que depuis DRAFT ; la clôture depuis PUBLISHED.
// Un formulaire CLOSED est terminal (pas de réouverture dans ce périmètre).

/** Transitions de statut autorisées (clé = état courant). */
const ALLOWED_TRANSITIONS: Record<FormStatus, readonly FormStatus[]> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: ["CLOSED"],
  CLOSED: [],
};

/** Indique si la transition `from → to` est autorisée. */
export function canTransition(from: FormStatus, to: FormStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Un questionnaire ne peut être publié que depuis l'état DRAFT. */
export function canPublish(status: FormStatus): boolean {
  return canTransition(status, "PUBLISHED");
}

/** Un questionnaire ne peut être clôturé que depuis l'état PUBLISHED. */
export function canClose(status: FormStatus): boolean {
  return canTransition(status, "CLOSED");
}

// --- Réordonnancement -------------------------------------------------------

/** Élément réordonnançable : porteur d'un identifiant et d'une position. */
export interface Orderable {
  id: string;
  order: number;
}

/**
 * Applique un nouvel ordre à une collection d'éléments à partir d'une liste
 * ordonnée d'identifiants : la position de chaque élément devient son index dans
 * `orderedIds`. Fonction PURE.
 *
 * @throws Error si `orderedIds` ne correspond pas EXACTEMENT (même ensemble)
 *         aux identifiants des éléments — on refuse un réordonnancement partiel
 *         ou portant sur des identifiants inconnus.
 */
export function applyReorder<T extends Orderable>(
  items: readonly T[],
  orderedIds: readonly string[],
): T[] {
  const itemIds = new Set(items.map((item) => item.id));
  const targetIds = new Set(orderedIds);

  if (
    itemIds.size !== targetIds.size ||
    ![...itemIds].every((id) => targetIds.has(id))
  ) {
    throw new Error(
      "La liste de réordonnancement doit couvrir exactement les éléments existants.",
    );
  }

  const positionById = new Map(orderedIds.map((id, index) => [id, index]));

  return items
    .map((item) => ({ ...item, order: positionById.get(item.id)! }))
    .sort((a, b) => a.order - b.order);
}
