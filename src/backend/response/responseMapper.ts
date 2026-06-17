import {
  type PublicForm,
  type PublicOption,
  type PublicQuestion,
  type QuestionType,
} from "@/shared/schemas";

// Logique PURE du domaine « Response » : mapping vers les DTO publics et
// agrégation des réponses pour le Response Viewer.
//
// Aucune dépendance à Prisma runtime ni au réseau : ce module ne manipule que
// des structures de données simples. Il est entièrement testable avec des
// fixtures (voir tests/unitaire/backend). Les types d'ENTRÉE sont décrits de
// façon **structurelle** (ce dont les fonctions ont besoin), de sorte que les
// objets chargés par le repository les satisfont sans couplage.

// --- Formes d'entrée (structurelles) ---------------------------------------

/** Option telle que chargée en base (avec `questionId`, jamais exposé tel quel). */
export interface OptionRow {
  id: string;
  label: string;
  order: number;
}

/** Question telle que chargée en base, avec ses options. */
export interface QuestionRow {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  order: number;
  options: OptionRow[];
}

/**
 * Form tel que chargé en base. Contient l'`id` interne — c'est précisément ce
 * que `toPublicForm` doit **ne pas** laisser fuiter vers le public.
 */
export interface FormRow {
  id: string;
  publicId: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  questions: QuestionRow[];
}

/** Option sélectionnée portée par une `Answer`. */
export interface SelectedOptionRow {
  id: string;
  label: string;
  order: number;
}

/** Réponse à une question au sein d'une soumission. */
export interface AnswerRow {
  questionId: string;
  value: string | null;
  selectedOptions: SelectedOptionRow[];
}

/** Une soumission complète chargée en base. */
export interface ResponseRow {
  id: string;
  submittedAt: Date;
  answers: AnswerRow[];
}

// --- Mapping vers les DTO publics ------------------------------------------

/** Mappe une option de base vers le DTO public (mêmes champs, sans `questionId`). */
function toPublicOption(option: OptionRow): PublicOption {
  return { id: option.id, label: option.label, order: option.order };
}

/** Mappe une question de base vers le DTO public (sans `formId`), options triées. */
function toPublicQuestion(question: QuestionRow): PublicQuestion {
  return {
    id: question.id,
    label: question.label,
    type: question.type,
    required: question.required,
    order: question.order,
    options: [...question.options]
      .sort((a, b) => a.order - b.order)
      .map(toPublicOption),
  };
}

/**
 * Construit le DTO **public** d'un questionnaire publié à partir de la ligne
 * chargée en base.
 *
 * Frontière de sécurité (voir docs/security.md) : l'`id` interne du `Form`
 * **n'est jamais recopié** dans le DTO — seul `publicId` l'est. L'ordre des
 * questions et des options est préservé (tri par `order`).
 *
 * Le statut est figé à `"PUBLISHED"` : cette fonction n'est appelée que pour un
 * `Form` déjà filtré comme publié par le service/repository.
 */
export function toPublicForm(form: FormRow): PublicForm {
  return {
    publicId: form.publicId,
    title: form.title,
    description: form.description,
    status: "PUBLISHED",
    questions: [...form.questions]
      .sort((a, b) => a.order - b.order)
      .map(toPublicQuestion),
  };
}

// --- Agrégation des réponses (Response Viewer) ------------------------------

/** Décompte des sélections d'une option (types à choix). */
export interface OptionTally {
  optionId: string;
  label: string;
  count: number;
}

/**
 * Agrégat d'une question, discriminé par `kind` selon la famille du type :
 *  - `choice` : compteurs par option (SINGLE_CHOICE / MULTIPLE_CHOICE) ;
 *  - `rating` : moyenne + nombre de notes (RATING) ;
 *  - `value`  : liste des valeurs saisies (texte, nombre, e-mail, date).
 */
export type QuestionAggregate =
  | {
      kind: "choice";
      questionId: string;
      label: string;
      type: Extract<QuestionType, "SINGLE_CHOICE" | "MULTIPLE_CHOICE">;
      answersCount: number;
      options: OptionTally[];
    }
  | {
      kind: "rating";
      questionId: string;
      label: string;
      type: "RATING";
      answersCount: number;
      average: number | null;
    }
  | {
      kind: "value";
      questionId: string;
      label: string;
      type: Extract<
        QuestionType,
        "SHORT_TEXT" | "LONG_TEXT" | "NUMBER" | "EMAIL" | "DATE"
      >;
      answersCount: number;
      values: string[];
    };

/** Résultat d'agrégation servi au Response Viewer. */
export interface ResponsesAggregate {
  publicId: string;
  title: string;
  totalResponses: number;
  questions: QuestionAggregate[];
}

const CHOICE_TYPES: ReadonlySet<QuestionType> = new Set([
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
]);

/**
 * Agrège les réponses d'un questionnaire **par question**, dans l'ordre des
 * questions du `Form`. Fonction pure (aucune base) :
 *  - choix (SINGLE/MULTIPLE_CHOICE) → compteur par option (toutes les options de
 *    la question sont présentes, même à 0) ;
 *  - RATING → moyenne des notes (`null` si aucune note) ;
 *  - autres (texte, nombre, e-mail, date) → liste des valeurs non vides saisies.
 *
 * Les réponses vides (ni valeur, ni option) ne sont pas comptées dans
 * `answersCount`.
 */
export function aggregateResponses(
  form: FormRow,
  responses: ResponseRow[],
): ResponsesAggregate {
  // Index : questionId -> liste des Answer correspondantes (toutes soumissions).
  const answersByQuestion = new Map<string, AnswerRow[]>();
  for (const response of responses) {
    for (const answer of response.answers) {
      const bucket = answersByQuestion.get(answer.questionId);
      if (bucket) {
        bucket.push(answer);
      } else {
        answersByQuestion.set(answer.questionId, [answer]);
      }
    }
  }

  const orderedQuestions = [...form.questions].sort((a, b) => a.order - b.order);

  const questions: QuestionAggregate[] = orderedQuestions.map((question) => {
    const answers = answersByQuestion.get(question.id) ?? [];

    if (CHOICE_TYPES.has(question.type)) {
      // Compteur par option : on part de toutes les options (ordre préservé) à 0,
      // puis on incrémente selon les options réellement sélectionnées.
      const tallies = new Map<string, OptionTally>();
      for (const option of [...question.options].sort((a, b) => a.order - b.order)) {
        tallies.set(option.id, {
          optionId: option.id,
          label: option.label,
          count: 0,
        });
      }

      let answersCount = 0;
      for (const answer of answers) {
        if (answer.selectedOptions.length === 0) continue;
        answersCount += 1;
        for (const selected of answer.selectedOptions) {
          const tally = tallies.get(selected.id);
          if (tally) {
            tally.count += 1;
          } else {
            // Option introuvable dans la définition (cas limite) : on l'ajoute
            // pour ne pas perdre la donnée.
            tallies.set(selected.id, {
              optionId: selected.id,
              label: selected.label,
              count: 1,
            });
          }
        }
      }

      return {
        kind: "choice",
        questionId: question.id,
        label: question.label,
        type: question.type as "SINGLE_CHOICE" | "MULTIPLE_CHOICE",
        answersCount,
        options: [...tallies.values()],
      };
    }

    if (question.type === "RATING") {
      const ratings = answers
        .map((answer) => Number(answer.value))
        .filter((n) => Number.isFinite(n));
      const average =
        ratings.length > 0
          ? ratings.reduce((sum, n) => sum + n, 0) / ratings.length
          : null;
      return {
        kind: "rating",
        questionId: question.id,
        label: question.label,
        type: "RATING",
        answersCount: ratings.length,
        average,
      };
    }

    // Types « valeur » : texte, nombre, e-mail, date.
    const values = answers
      .map((answer) => answer.value?.trim() ?? "")
      .filter((value) => value.length > 0);
    return {
      kind: "value",
      questionId: question.id,
      label: question.label,
      type: question.type as
        | "SHORT_TEXT"
        | "LONG_TEXT"
        | "NUMBER"
        | "EMAIL"
        | "DATE",
      answersCount: values.length,
      values,
    };
  });

  return {
    publicId: form.publicId,
    title: form.title,
    totalResponses: responses.length,
    questions,
  };
}
