import { buildSubmitResponseSchema } from "@/shared/schemas";
import { type QuestionRow } from "@/backend/response/responseMapper";

// Test unitaire (backend) — validation d'une soumission telle que la pratique
// `responseService.submitResponse` : on construit le schéma paramétré à partir
// des questions du `Form` chargé, puis on `safeParse` l'entrée publique.
// Logique PURE (Zod), fixtures uniquement — aucune base ni réseau.

// Les questions ont la forme chargée par le repository (QuestionRow). Seuls
// { id, type, required } sont lus par buildSubmitResponseSchema.
const questions: QuestionRow[] = [
  {
    id: "q1",
    label: "Prénom",
    type: "SHORT_TEXT",
    required: true,
    order: 0,
    options: [],
  },
  {
    id: "q2",
    label: "Niveau",
    type: "SINGLE_CHOICE",
    required: true,
    order: 1,
    options: [
      { id: "o2a", label: "Débutant", order: 0 },
      { id: "o2b", label: "Confirmé", order: 1 },
    ],
  },
  {
    id: "q3",
    label: "Commentaire",
    type: "LONG_TEXT",
    required: false,
    order: 2,
    options: [],
  },
];

describe("buildSubmitResponseSchema (validation de soumission via le service)", () => {
  it("accepte une soumission valide (toutes les questions requises remplies)", () => {
    const schema = buildSubmitResponseSchema(questions);
    const result = schema.safeParse({
      answers: [
        { questionId: "q1", value: "Jean" },
        { questionId: "q2", selectedOptionIds: ["o2a"] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejette une soumission dont une réponse requise est manquante", () => {
    const schema = buildSubmitResponseSchema(questions);
    const result = schema.safeParse({
      // q2 (SINGLE_CHOICE requis) absente
      answers: [{ questionId: "q1", value: "Jean" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejette un choix unique invalide (deux options sélectionnées)", () => {
    const schema = buildSubmitResponseSchema(questions);
    const result = schema.safeParse({
      answers: [
        { questionId: "q1", value: "Jean" },
        { questionId: "q2", selectedOptionIds: ["o2a", "o2b"] },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejette une réponse référençant une question inconnue", () => {
    const schema = buildSubmitResponseSchema(questions);
    const result = schema.safeParse({
      answers: [
        { questionId: "q1", value: "Jean" },
        { questionId: "q2", selectedOptionIds: ["o2a"] },
        { questionId: "fantome", value: "x" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepte une question facultative laissée vide", () => {
    const schema = buildSubmitResponseSchema(questions);
    const result = schema.safeParse({
      answers: [
        { questionId: "q1", value: "Jean" },
        { questionId: "q2", selectedOptionIds: ["o2a"] },
        // q3 (LONG_TEXT facultatif) omise → accepté
      ],
    });
    expect(result.success).toBe(true);
  });
});
