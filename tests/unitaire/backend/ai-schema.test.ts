import {
  aiGenerateSchema,
  aiProofreadSchema,
  MAX_AI_PROMPT_LENGTH,
} from "@/shared/schemas";

// Tests unitaires (backend) — schémas d'entrée de l'assistance IA. Vérifient la
// validation des corps de requête (prompt / texte) sans aucun appel réseau.

describe("aiGenerateSchema (unitaire)", () => {
  it("accepte un prompt non vide et le rogne", () => {
    const result = aiGenerateSchema.parse({ prompt: "  Un quiz sur l'IA  " });
    expect(result.prompt).toBe("Un quiz sur l'IA");
  });

  it("rejette un prompt vide", () => {
    expect(() => aiGenerateSchema.parse({ prompt: "   " })).toThrow();
  });

  it("rejette un corps sans prompt", () => {
    expect(() => aiGenerateSchema.parse({})).toThrow();
  });

  it(`accepte un prompt à la borne (${MAX_AI_PROMPT_LENGTH} caractères)`, () => {
    const prompt = "a".repeat(MAX_AI_PROMPT_LENGTH);
    expect(aiGenerateSchema.parse({ prompt }).prompt).toBe(prompt);
  });

  it("rejette un prompt qui dépasse la borne d'un caractère", () => {
    expect(() =>
      aiGenerateSchema.parse({ prompt: "a".repeat(MAX_AI_PROMPT_LENGTH + 1) }),
    ).toThrow();
  });
});

describe("aiProofreadSchema (unitaire)", () => {
  it("accepte un texte non vide et le rogne", () => {
    const result = aiProofreadSchema.parse({ text: "  bonjour  " });
    expect(result.text).toBe("bonjour");
  });

  it("rejette un texte vide", () => {
    expect(() => aiProofreadSchema.parse({ text: "" })).toThrow();
  });

  it("rejette un corps sans texte", () => {
    expect(() => aiProofreadSchema.parse({})).toThrow();
  });
});
