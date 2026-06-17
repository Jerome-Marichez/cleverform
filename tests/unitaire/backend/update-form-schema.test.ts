import { updateFormSchema } from "@/shared/schemas/formInput";

// Test unitaire (backend) — mise à jour partielle d'un questionnaire.
describe("updateFormSchema (unitaire)", () => {
  it("valide une mise à jour du seul titre", () => {
    const result = updateFormSchema.safeParse({ title: "Nouveau titre" });
    expect(result.success).toBe(true);
  });

  it("valide un changement de statut", () => {
    const result = updateFormSchema.safeParse({ status: "PUBLISHED" });
    expect(result.success).toBe(true);
  });

  it("rejette une mise à jour vide (aucun champ)", () => {
    const result = updateFormSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejette un statut invalide", () => {
    const result = updateFormSchema.safeParse({ status: "ARCHIVED" });
    expect(result.success).toBe(false);
  });

  it("rejette un titre fourni mais vide", () => {
    const result = updateFormSchema.safeParse({ title: "  " });
    expect(result.success).toBe(false);
  });
});
