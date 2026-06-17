import { z, ZodError } from "zod";
import { toAiErrorResponse } from "@/backend/ai/aiHttp";
import { AiUnavailableError, MissingApiKeyError } from "@/backend/ai/aiClient";
import { AiGenerationError } from "@/backend/ai/aiErrors";
import { UnauthorizedError } from "@/backend/auth/requireAdmin";

// Tests unitaires du mapping des erreurs IA en réponses HTTP (`toAiErrorResponse`).
// Logique pure : on construit des erreurs réelles et on vérifie le code renvoyé.

function zodError(): ZodError {
  return z.string().safeParse(123).error as ZodError;
}

describe("toAiErrorResponse (unitaire)", () => {
  it("UnauthorizedError → 401", async () => {
    const res = toAiErrorResponse(new UnauthorizedError());
    expect(res.status).toBe(401);
  });

  it("ZodError → 400 avec détails", async () => {
    const res = toAiErrorResponse(zodError());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Données invalides.");
    expect(body.details).toBeDefined();
  });

  it("MissingApiKeyError → 503 (IA indisponible)", () => {
    expect(toAiErrorResponse(new MissingApiKeyError()).status).toBe(503);
  });

  it("AiUnavailableError (clé invalide / refusée) → 503 (IA indisponible)", async () => {
    const res = toAiErrorResponse(new AiUnavailableError());
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe(
      "L'assistance IA est indisponible pour le moment.",
    );
  });

  it("AiGenerationError → 502", () => {
    expect(toAiErrorResponse(new AiGenerationError("format invalide")).status).toBe(
      502,
    );
  });

  it("erreur inattendue → 500 (sans fuite de détail)", async () => {
    // La voie 500 journalise : on neutralise la sortie pour garder les logs propres.
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = toAiErrorResponse(new Error("panne réseau"));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Une erreur interne est survenue.");
    spy.mockRestore();
  });
});
