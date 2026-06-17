import { loginSchema } from "@/shared/schemas/auth";

// Test unitaire (backend) — schéma de connexion administrateur.
describe("loginSchema (unitaire)", () => {
  it("valide un mot de passe non vide", () => {
    const result = loginSchema.safeParse({ password: "secret" });
    expect(result.success).toBe(true);
  });

  it("rejette un mot de passe vide", () => {
    const result = loginSchema.safeParse({ password: "" });
    expect(result.success).toBe(false);
  });

  it("rejette l'absence de mot de passe", () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
