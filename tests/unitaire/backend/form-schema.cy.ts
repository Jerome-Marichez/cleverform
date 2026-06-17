import { generatedFormSchema } from "../../../src/core/schemas/form";

// Test unitaire (backend) — logique pure : validation Zod de la sortie IA.
describe("generatedFormSchema (unitaire)", () => {
  it("valide un questionnaire bien formé", () => {
    const result = generatedFormSchema.safeParse({
      title: "Event IA",
      questions: [{ label: "Votre nom ?", type: "SHORT_TEXT" }],
    });
    expect(result.success).to.equal(true);
  });

  it("rejette un questionnaire sans question", () => {
    const result = generatedFormSchema.safeParse({ title: "x", questions: [] });
    expect(result.success).to.equal(false);
  });
});
