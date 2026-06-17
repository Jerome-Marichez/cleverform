import {
  aggregateResponses,
  toPublicForm,
  type FormRow,
  type ResponseRow,
} from "@/backend/response/responseMapper";

// Test unitaire (backend) — logique PURE du domaine « Response » :
//  - `toPublicForm`     : mapping DTO public (aucune fuite de l'id interne,
//                         ordre des questions/options préservé) ;
//  - `aggregateResponses` : compteurs par option, moyenne RATING, valeurs texte.
// Fixtures uniquement — aucune dépendance à Prisma/db/réseau.

// --- Fixtures ---------------------------------------------------------------

const form: FormRow = {
  id: "form-interne-123", // id interne : NE DOIT PAS fuiter dans le DTO public
  publicId: "pub-abc",
  title: "Soirée IA",
  description: "Un questionnaire de démonstration.",
  status: "PUBLISHED",
  questions: [
    // Volontairement dans le désordre pour vérifier le tri par `order`.
    {
      id: "q2",
      label: "Votre niveau ?",
      type: "SINGLE_CHOICE",
      required: true,
      order: 1,
      options: [
        { id: "o2b", label: "Confirmé", order: 1 },
        { id: "o2a", label: "Débutant", order: 0 },
      ],
    },
    {
      id: "q1",
      label: "Votre prénom ?",
      type: "SHORT_TEXT",
      required: true,
      order: 0,
      options: [],
    },
    {
      id: "q3",
      label: "Note de la soirée",
      type: "RATING",
      required: false,
      order: 2,
      options: [],
    },
    {
      id: "q4",
      label: "Sujets souhaités",
      type: "MULTIPLE_CHOICE",
      required: false,
      order: 3,
      options: [
        { id: "o4a", label: "LLM", order: 0 },
        { id: "o4b", label: "Vision", order: 1 },
      ],
    },
  ],
};

describe("toPublicForm", () => {
  it("ne laisse jamais fuiter l'id interne du Form", () => {
    const dto = toPublicForm(form);
    // Aucune clé `id` sur le DTO ni valeur égale à l'id interne, à aucun niveau.
    expect(dto).not.toHaveProperty("id");
    expect(JSON.stringify(dto)).not.toContain("form-interne-123");
    expect(dto.publicId).toBe("pub-abc");
    expect(dto.status).toBe("PUBLISHED");
  });

  it("préserve l'ordre des questions (tri par order)", () => {
    const dto = toPublicForm(form);
    expect(dto.questions.map((q) => q.id)).toEqual(["q1", "q2", "q3", "q4"]);
  });

  it("préserve l'ordre des options (tri par order)", () => {
    const dto = toPublicForm(form);
    const single = dto.questions.find((q) => q.id === "q2");
    expect(single?.options.map((o) => o.id)).toEqual(["o2a", "o2b"]);
  });

  it("mappe les champs publics attendus sans formId/questionId", () => {
    const dto = toPublicForm(form);
    const question = dto.questions[0];
    expect(question).toEqual({
      id: "q1",
      label: "Votre prénom ?",
      type: "SHORT_TEXT",
      required: true,
      order: 0,
      options: [],
    });
  });
});

describe("aggregateResponses", () => {
  const responses: ResponseRow[] = [
    {
      id: "r1",
      submittedAt: new Date("2026-06-01T10:00:00Z"),
      answers: [
        { questionId: "q1", value: "Jean", selectedOptions: [] },
        {
          questionId: "q2",
          value: null,
          selectedOptions: [{ id: "o2a", label: "Débutant", order: 0 }],
        },
        { questionId: "q3", value: "4", selectedOptions: [] },
        {
          questionId: "q4",
          value: null,
          selectedOptions: [
            { id: "o4a", label: "LLM", order: 0 },
            { id: "o4b", label: "Vision", order: 1 },
          ],
        },
      ],
    },
    {
      id: "r2",
      submittedAt: new Date("2026-06-02T10:00:00Z"),
      answers: [
        { questionId: "q1", value: "Marie", selectedOptions: [] },
        {
          questionId: "q2",
          value: null,
          selectedOptions: [{ id: "o2a", label: "Débutant", order: 0 }],
        },
        { questionId: "q3", value: "2", selectedOptions: [] },
        {
          questionId: "q4",
          value: null,
          selectedOptions: [{ id: "o4a", label: "LLM", order: 0 }],
        },
      ],
    },
  ];

  it("compte le nombre total de soumissions", () => {
    const result = aggregateResponses(form, responses);
    expect(result.totalResponses).toBe(2);
    expect(result.publicId).toBe("pub-abc");
    expect(result.title).toBe("Soirée IA");
  });

  it("compte les sélections par option (SINGLE_CHOICE), options à 0 incluses", () => {
    const result = aggregateResponses(form, responses);
    const single = result.questions.find((q) => q.questionId === "q2");
    expect(single?.kind).toBe("choice");
    if (single?.kind !== "choice") throw new Error("attendu : choice");
    expect(single.answersCount).toBe(2);
    expect(single.options).toEqual([
      { optionId: "o2a", label: "Débutant", count: 2 },
      { optionId: "o2b", label: "Confirmé", count: 0 },
    ]);
  });

  it("compte chaque option d'un MULTIPLE_CHOICE indépendamment", () => {
    const result = aggregateResponses(form, responses);
    const multi = result.questions.find((q) => q.questionId === "q4");
    if (multi?.kind !== "choice") throw new Error("attendu : choice");
    expect(multi.answersCount).toBe(2);
    expect(multi.options).toEqual([
      { optionId: "o4a", label: "LLM", count: 2 },
      { optionId: "o4b", label: "Vision", count: 1 },
    ]);
  });

  it("calcule la moyenne d'une question RATING", () => {
    const result = aggregateResponses(form, responses);
    const rating = result.questions.find((q) => q.questionId === "q3");
    if (rating?.kind !== "rating") throw new Error("attendu : rating");
    expect(rating.answersCount).toBe(2);
    expect(rating.average).toBe(3); // (4 + 2) / 2
  });

  it("collecte les valeurs texte non vides (SHORT_TEXT)", () => {
    const result = aggregateResponses(form, responses);
    const text = result.questions.find((q) => q.questionId === "q1");
    if (text?.kind !== "value") throw new Error("attendu : value");
    expect(text.answersCount).toBe(2);
    expect(text.values).toEqual(["Jean", "Marie"]);
  });

  it("renvoie une moyenne null et des compteurs à 0 sans réponse", () => {
    const result = aggregateResponses(form, []);
    expect(result.totalResponses).toBe(0);
    const rating = result.questions.find((q) => q.questionId === "q3");
    if (rating?.kind !== "rating") throw new Error("attendu : rating");
    expect(rating.average).toBeNull();
    expect(rating.answersCount).toBe(0);
    const single = result.questions.find((q) => q.questionId === "q2");
    if (single?.kind !== "choice") throw new Error("attendu : choice");
    expect(single.options.every((o) => o.count === 0)).toBe(true);
  });

  it("préserve l'ordre des questions dans l'agrégat", () => {
    const result = aggregateResponses(form, responses);
    expect(result.questions.map((q) => q.questionId)).toEqual([
      "q1",
      "q2",
      "q3",
      "q4",
    ]);
  });
});
