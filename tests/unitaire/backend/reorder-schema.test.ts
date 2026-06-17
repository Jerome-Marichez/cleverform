import { reorderSchema } from "@/shared/schemas/formInput";

// Test unitaire (backend) — réordonnancement (liste d'identifiants ordonnés).
describe("reorderSchema (unitaire)", () => {
  it("valide une liste d'identifiants uniques", () => {
    const result = reorderSchema.safeParse({ orderedIds: ["a", "b", "c"] });
    expect(result.success).toBe(true);
  });

  it("rejette une liste vide", () => {
    const result = reorderSchema.safeParse({ orderedIds: [] });
    expect(result.success).toBe(false);
  });

  it("rejette des identifiants en double", () => {
    const result = reorderSchema.safeParse({ orderedIds: ["a", "a", "b"] });
    expect(result.success).toBe(false);
  });

  it("rejette un identifiant vide", () => {
    const result = reorderSchema.safeParse({ orderedIds: ["a", ""] });
    expect(result.success).toBe(false);
  });
});
