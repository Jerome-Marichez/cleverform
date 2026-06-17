import { aiGenerateSchema, aiProofreadSchema } from "@/shared/schemas";

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

  it("rejette un prompt trop long", () => {
    expect(() =>
      aiGenerateSchema.parse({ prompt: "a".repeat(2001) }),
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
