import {
  buildSubmitResponseSchema,
  submitResponseSchema,
  validateAnswerForType,
  type AnswerInput,
} from "@/shared/schemas/response";
import { type QuestionType } from "@/shared/schemas/form";

// Test unitaire (backend) — soumission de réponses : forme brute, règles par
// type (validateAnswerForType) et schéma paramétré (buildSubmitResponseSchema).

describe("submitResponseSchema (forme brute)", () => {
  it("valide une soumission avec au moins une réponse", () => {
    const result = submitResponseSchema.safeParse({
      answers: [{ questionId: "q1", value: "Jean" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejette une soumission sans réponse", () => {
    const result = submitResponseSchema.safeParse({ answers: [] });
    expect(result.success).toBe(false);
  });

  it("rejette une réponse sans questionId", () => {
    const result = submitResponseSchema.safeParse({
      answers: [{ value: "x" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("validateAnswerForType (règles par type)", () => {
  const answer = (a: Partial<AnswerInput>): AnswerInput => ({
    questionId: "q1",
    ...a,
  });

  it("accepte une question facultative laissée vide", () => {
    const result = validateAnswerForType("SHORT_TEXT", answer({}), false);
    expect(result.valid).toBe(true);
  });

  it("rejette une question obligatoire laissée vide", () => {
    const result = validateAnswerForType("SHORT_TEXT", answer({ value: "  " }), true);
    expect(result.valid).toBe(false);
  });

  it("accepte un texte court rempli", () => {
    const result = validateAnswerForType("SHORT_TEXT", answer({ value: "Jean" }), true);
    expect(result.valid).toBe(true);
  });

  it("accepte un e-mail bien formé", () => {
    const result = validateAnswerForType(
      "EMAIL",
      answer({ value: "a@b.com" }),
      true,
    );
    expect(result.valid).toBe(true);
  });

  it("rejette un e-mail mal formé", () => {
    const result = validateAnswerForType("EMAIL", answer({ value: "a@b" }), true);
    expect(result.valid).toBe(false);
  });

  it("accepte un nombre", () => {
    const result = validateAnswerForType("NUMBER", answer({ value: "42" }), true);
    expect(result.valid).toBe(true);
  });

  it("rejette un nombre non numérique", () => {
    const result = validateAnswerForType("NUMBER", answer({ value: "abc" }), true);
    expect(result.valid).toBe(false);
  });

  it("accepte une note entière positive (RATING)", () => {
    const result = validateAnswerForType("RATING", answer({ value: "4" }), true);
    expect(result.valid).toBe(true);
  });

  it("rejette une note non entière (RATING)", () => {
    const result = validateAnswerForType("RATING", answer({ value: "4.5" }), true);
    expect(result.valid).toBe(false);
  });

  it("accepte une date valide", () => {
    const result = validateAnswerForType(
      "DATE",
      answer({ value: "2026-06-17" }),
      true,
    );
    expect(result.valid).toBe(true);
  });

  it("rejette une date invalide", () => {
    const result = validateAnswerForType(
      "DATE",
      answer({ value: "pas-une-date" }),
      true,
    );
    expect(result.valid).toBe(false);
  });

  it("accepte exactement une option (SINGLE_CHOICE)", () => {
    const result = validateAnswerForType(
      "SINGLE_CHOICE",
      answer({ selectedOptionIds: ["opt1"] }),
      true,
    );
    expect(result.valid).toBe(true);
  });

  it("rejette plusieurs options pour un choix unique (SINGLE_CHOICE)", () => {
    const result = validateAnswerForType(
      "SINGLE_CHOICE",
      answer({ selectedOptionIds: ["opt1", "opt2"] }),
      true,
    );
    expect(result.valid).toBe(false);
  });

  it("accepte plusieurs options (MULTIPLE_CHOICE)", () => {
    const result = validateAnswerForType(
      "MULTIPLE_CHOICE",
      answer({ selectedOptionIds: ["opt1", "opt2"] }),
      true,
    );
    expect(result.valid).toBe(true);
  });

  it("rejette un choix multiple obligatoire sans option", () => {
    const result = validateAnswerForType(
      "MULTIPLE_CHOICE",
      answer({ selectedOptionIds: [] }),
      true,
    );
    expect(result.valid).toBe(false);
  });
});

describe("buildSubmitResponseSchema (soumission complète)", () => {
  const questions: Array<{ id: string; type: QuestionType; required: boolean }> = [
    { id: "q1", type: "SHORT_TEXT", required: true },
    { id: "q2", type: "EMAIL", required: true },
    { id: "q3", type: "SINGLE_CHOICE", required: false },
  ];

  it("valide une soumission conforme", () => {
    const schema = buildSubmitResponseSchema(questions);
    const result = schema.safeParse({
      answers: [
        { questionId: "q1", value: "Jean" },
        { questionId: "q2", value: "jean@exemple.com" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejette si une question obligatoire est absente", () => {
    const schema = buildSubmitResponseSchema(questions);
    const result = schema.safeParse({
      answers: [{ questionId: "q1", value: "Jean" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejette une réponse référençant une question inconnue", () => {
    const schema = buildSubmitResponseSchema(questions);
    const result = schema.safeParse({
      answers: [
        { questionId: "q1", value: "Jean" },
        { questionId: "q2", value: "jean@exemple.com" },
        { questionId: "inconnue", value: "x" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejette une réponse qui viole la règle de son type (email)", () => {
    const schema = buildSubmitResponseSchema(questions);
    const result = schema.safeParse({
      answers: [
        { questionId: "q1", value: "Jean" },
        { questionId: "q2", value: "pas-un-email" },
      ],
    });
    expect(result.success).toBe(false);
  });
});
