import { optionInputSchema } from "@/shared/schemas/formInput";

// Test unitaire (backend) — validation Zod d'une option de choix.
describe("optionInputSchema (unitaire)", () => {
  it("valide une option bien formée", () => {
    const result = optionInputSchema.safeParse({ label: "Oui", order: 0 });
    expect(result.success).toBe(true);
  });

  it("rejette un libellé vide", () => {
    const result = optionInputSchema.safeParse({ label: "   ", order: 0 });
    expect(result.success).toBe(false);
  });

  it("rejette un ordre non entier", () => {
    const result = optionInputSchema.safeParse({ label: "Oui", order: 1.5 });
    expect(result.success).toBe(false);
  });

  it("rejette un ordre négatif", () => {
    const result = optionInputSchema.safeParse({ label: "Oui", order: -1 });
    expect(result.success).toBe(false);
  });
});
