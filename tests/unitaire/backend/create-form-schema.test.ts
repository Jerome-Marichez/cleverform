import { createFormSchema } from "@/shared/schemas/formInput";

// Test unitaire (backend) — validation Zod de la création d'un questionnaire.
describe("createFormSchema (unitaire)", () => {
  const validQuestion = {
    label: "Votre nom ?",
    type: "SHORT_TEXT" as const,
    required: true,
    order: 0,
  };

  it("valide un questionnaire complet", () => {
    const result = createFormSchema.safeParse({
      title: "Inscription event",
      description: "Quelques questions rapides",
      questions: [validQuestion],
    });
    expect(result.success).toBe(true);
  });

  it("accepte l'absence de description", () => {
    const result = createFormSchema.safeParse({
      title: "Sans description",
      questions: [validQuestion],
    });
    expect(result.success).toBe(true);
  });

  it("rejette un titre vide", () => {
    const result = createFormSchema.safeParse({
      title: "   ",
      questions: [validQuestion],
    });
    expect(result.success).toBe(false);
  });

  it("rejette un questionnaire sans question", () => {
    const result = createFormSchema.safeParse({
      title: "Vide",
      questions: [],
    });
    expect(result.success).toBe(false);
  });

  it("propage l'invalidité d'une question (choix sans option)", () => {
    const result = createFormSchema.safeParse({
      title: "Mauvaise question",
      questions: [
        {
          label: "Couleur ?",
          type: "SINGLE_CHOICE",
          required: true,
          order: 0,
          options: [],
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
