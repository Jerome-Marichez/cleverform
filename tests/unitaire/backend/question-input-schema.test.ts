import { questionInputSchema } from "@/shared/schemas/formInput";

// Test unitaire (backend) — validation Zod d'une question, dont la règle des
// options conditionnée par le type (superRefine).
describe("questionInputSchema (unitaire)", () => {
  it("valide une question texte sans option", () => {
    const result = questionInputSchema.safeParse({
      label: "Votre nom ?",
      type: "SHORT_TEXT",
      required: true,
      order: 0,
    });
    expect(result.success).toBe(true);
  });

  it("applique la valeur par défaut de `required` (false)", () => {
    const result = questionInputSchema.safeParse({
      label: "Commentaire",
      type: "LONG_TEXT",
      order: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.required).toBe(false);
      expect(result.data.options).toEqual([]);
    }
  });

  it("valide une question à choix unique avec options", () => {
    const result = questionInputSchema.safeParse({
      label: "Couleur préférée ?",
      type: "SINGLE_CHOICE",
      required: true,
      order: 1,
      options: [
        { label: "Rouge", order: 0 },
        { label: "Bleu", order: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejette une question à choix sans option", () => {
    const result = questionInputSchema.safeParse({
      label: "Couleur préférée ?",
      type: "MULTIPLE_CHOICE",
      required: true,
      order: 0,
      options: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejette une question texte qui porte des options", () => {
    const result = questionInputSchema.safeParse({
      label: "Votre nom ?",
      type: "SHORT_TEXT",
      required: false,
      order: 0,
      options: [{ label: "Option parasite", order: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejette un libellé vide", () => {
    const result = questionInputSchema.safeParse({
      label: "",
      type: "SHORT_TEXT",
      order: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejette un type inconnu", () => {
    const result = questionInputSchema.safeParse({
      label: "x",
      type: "UNKNOWN",
      order: 0,
    });
    expect(result.success).toBe(false);
  });
});
