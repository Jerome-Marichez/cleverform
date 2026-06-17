import {
  answerToFieldValue,
  buildDefaultValues,
  defaultFieldValue,
  fieldValueToAnswer,
  optionLabels,
} from "@/frontend/hooks/useResponderForm";
import type { PublicQuestion } from "@/shared/schemas";

// Tests unitaires des utilitaires de mapping du Form Responder : valeurs par
// défaut par type, conversion valeur d'affichage ⇄ `AnswerInput` (libellés ⇄
// identifiants d'options). Logique pure, sans rendu ni réseau.

function makeQuestion(overrides: Partial<PublicQuestion>): PublicQuestion {
  return {
    id: "q1",
    label: "Question",
    type: "SHORT_TEXT",
    required: false,
    order: 0,
    options: [],
    ...overrides,
  };
}

describe("defaultFieldValue", () => {
  it("renvoie un tableau vide pour MULTIPLE_CHOICE", () => {
    expect(defaultFieldValue("MULTIPLE_CHOICE")).toEqual([]);
  });

  it("renvoie null pour RATING", () => {
    expect(defaultFieldValue("RATING")).toBeNull();
  });

  it("renvoie une chaîne vide pour les types scalaires", () => {
    expect(defaultFieldValue("SHORT_TEXT")).toBe("");
    expect(defaultFieldValue("EMAIL")).toBe("");
    expect(defaultFieldValue("DATE")).toBe("");
    expect(defaultFieldValue("SINGLE_CHOICE")).toBe("");
  });
});

describe("buildDefaultValues", () => {
  it("crée un AnswerInput vide par question, dans l'ordre", () => {
    const values = buildDefaultValues([{ id: "a" }, { id: "b" }]);
    expect(values).toEqual({
      answers: [{ questionId: "a" }, { questionId: "b" }],
    });
  });
});

describe("optionLabels", () => {
  it("extrait les libellés d'options dans l'ordre fourni", () => {
    const question = makeQuestion({
      type: "SINGLE_CHOICE",
      options: [
        { id: "o1", label: "Oui", order: 0 },
        { id: "o2", label: "Non", order: 1 },
      ],
    });
    expect(optionLabels(question)).toEqual(["Oui", "Non"]);
  });
});

describe("fieldValueToAnswer", () => {
  it("scalaire (texte) → value", () => {
    const question = makeQuestion({ type: "SHORT_TEXT" });
    expect(fieldValueToAnswer(question, "bonjour")).toEqual({
      questionId: "q1",
      value: "bonjour",
    });
  });

  it("RATING → value sérialisée en chaîne", () => {
    const question = makeQuestion({ type: "RATING" });
    expect(fieldValueToAnswer(question, 4)).toEqual({
      questionId: "q1",
      value: "4",
    });
  });

  it("RATING null → value vide", () => {
    const question = makeQuestion({ type: "RATING" });
    expect(fieldValueToAnswer(question, null)).toEqual({
      questionId: "q1",
      value: "",
    });
  });

  it("SINGLE_CHOICE → selectedOptionIds avec l'id du libellé choisi", () => {
    const question = makeQuestion({
      type: "SINGLE_CHOICE",
      options: [
        { id: "o1", label: "Oui", order: 0 },
        { id: "o2", label: "Non", order: 1 },
      ],
    });
    expect(fieldValueToAnswer(question, "Non")).toEqual({
      questionId: "q1",
      selectedOptionIds: ["o2"],
    });
  });

  it("SINGLE_CHOICE vide → selectedOptionIds vide", () => {
    const question = makeQuestion({
      type: "SINGLE_CHOICE",
      options: [{ id: "o1", label: "Oui", order: 0 }],
    });
    expect(fieldValueToAnswer(question, "")).toEqual({
      questionId: "q1",
      selectedOptionIds: [],
    });
  });

  it("MULTIPLE_CHOICE → selectedOptionIds des libellés cochés", () => {
    const question = makeQuestion({
      type: "MULTIPLE_CHOICE",
      options: [
        { id: "o1", label: "IA", order: 0 },
        { id: "o2", label: "Web", order: 1 },
        { id: "o3", label: "Cloud", order: 2 },
      ],
    });
    expect(fieldValueToAnswer(question, ["IA", "Cloud"])).toEqual({
      questionId: "q1",
      selectedOptionIds: ["o1", "o3"],
    });
  });

  it("ignore les libellés inconnus côté MULTIPLE_CHOICE", () => {
    const question = makeQuestion({
      type: "MULTIPLE_CHOICE",
      options: [{ id: "o1", label: "IA", order: 0 }],
    });
    expect(fieldValueToAnswer(question, ["IA", "Inexistant"])).toEqual({
      questionId: "q1",
      selectedOptionIds: ["o1"],
    });
  });
});

describe("answerToFieldValue", () => {
  it("scalaire → value (chaîne)", () => {
    const question = makeQuestion({ type: "EMAIL" });
    expect(answerToFieldValue(question, { questionId: "q1", value: "a@b.fr" })).toBe(
      "a@b.fr",
    );
  });

  it("scalaire sans value → chaîne vide", () => {
    const question = makeQuestion({ type: "SHORT_TEXT" });
    expect(answerToFieldValue(question, { questionId: "q1" })).toBe("");
  });

  it("RATING → nombre parsé", () => {
    const question = makeQuestion({ type: "RATING" });
    expect(answerToFieldValue(question, { questionId: "q1", value: "3" })).toBe(3);
  });

  it("RATING vide → null", () => {
    const question = makeQuestion({ type: "RATING" });
    expect(answerToFieldValue(question, { questionId: "q1", value: "" })).toBeNull();
    expect(answerToFieldValue(question, { questionId: "q1" })).toBeNull();
  });

  it("SINGLE_CHOICE → libellé de l'option sélectionnée", () => {
    const question = makeQuestion({
      type: "SINGLE_CHOICE",
      options: [
        { id: "o1", label: "Oui", order: 0 },
        { id: "o2", label: "Non", order: 1 },
      ],
    });
    expect(
      answerToFieldValue(question, { questionId: "q1", selectedOptionIds: ["o2"] }),
    ).toBe("Non");
  });

  it("MULTIPLE_CHOICE → libellés des options sélectionnées", () => {
    const question = makeQuestion({
      type: "MULTIPLE_CHOICE",
      options: [
        { id: "o1", label: "IA", order: 0 },
        { id: "o2", label: "Web", order: 1 },
      ],
    });
    expect(
      answerToFieldValue(question, {
        questionId: "q1",
        selectedOptionIds: ["o1", "o2"],
      }),
    ).toEqual(["IA", "Web"]);
  });

  it("conserve un aller-retour cohérent (champ → answer → champ)", () => {
    const question = makeQuestion({
      type: "MULTIPLE_CHOICE",
      options: [
        { id: "o1", label: "IA", order: 0 },
        { id: "o2", label: "Web", order: 1 },
      ],
    });
    const answer = fieldValueToAnswer(question, ["Web"]);
    expect(answerToFieldValue(question, answer)).toEqual(["Web"]);
  });
});
