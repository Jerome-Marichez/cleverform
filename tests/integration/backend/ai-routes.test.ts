import { NextRequest } from "next/server";
import { POST as generateRoute } from "@/app/api/admin/ai/generate/route";
import { POST as proofreadRoute } from "@/app/api/admin/ai/proofread/route";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
} from "@/backend/auth/adminSession";

// Test d'intégration — gardes des routes IA admin (`/api/admin/ai/*`). On exerce
// les VRAIS handlers sur leurs chemins d'erreur, SANS appeler Anthropic :
//  - 401 quand la session admin est absente/invalide (requireAdmin) ;
//  - 400 quand le corps est invalide (prompt / texte vide → Zod).
// Le chemin nominal (appel IA réel) relève des tests système, pas d'ici.

async function adminRequest(url: string, body: unknown): Promise<NextRequest> {
  const token = await createSessionToken();
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: `${SESSION_COOKIE_NAME}=${token}`,
    },
    body: JSON.stringify(body),
  });
}

function anonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/ai/generate (intégration — gardes)", () => {
  it("renvoie 401 sans session admin", async () => {
    const response = await generateRoute(
      anonRequest("http://localhost/api/admin/ai/generate", {
        prompt: "Un quiz sur l'IA",
      }),
    );
    expect(response.status).toBe(401);
  });

  it("renvoie 400 avec une session valide mais un prompt vide", async () => {
    const response = await generateRoute(
      await adminRequest("http://localhost/api/admin/ai/generate", {
        prompt: "",
      }),
    );
    expect(response.status).toBe(400);
  });
});

describe("POST /api/admin/ai/proofread (intégration — gardes)", () => {
  it("renvoie 401 sans session admin", async () => {
    const response = await proofreadRoute(
      anonRequest("http://localhost/api/admin/ai/proofread", { text: "bonjour" }),
    );
    expect(response.status).toBe(401);
  });

  it("renvoie 400 avec une session valide mais un texte absent", async () => {
    const response = await proofreadRoute(
      await adminRequest("http://localhost/api/admin/ai/proofread", {}),
    );
    expect(response.status).toBe(400);
  });
});
