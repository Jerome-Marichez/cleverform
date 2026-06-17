import { POST as login } from "@/app/api/auth/login/route";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/backend/auth/adminSession";

// Test d'intégration — Route Handler de connexion admin (`/api/auth/login`).
// Exerce la vraie route : validation Zod, comparaison du mot de passe à temps
// constant et pose du cookie de session signé. Aucune BDD requise (auth « admin
// unique »). Mot de passe / secret fournis par le setup d'intégration.

function loginRequest(body: unknown, ip = "10.0.0.1"): Request {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login (intégration)", () => {
  it("pose un cookie de session valide avec le bon mot de passe", async () => {
    const response = await login(
      loginRequest({ password: process.env.ADMIN_PASSWORD }, "10.0.0.10"),
    );
    expect(response.status).toBe(200);

    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(SESSION_COOKIE_NAME);
    expect(setCookie.toLowerCase()).toContain("httponly");

    // Le jeton posé doit être vérifiable avec le secret de session.
    const token = setCookie.split(`${SESSION_COOKIE_NAME}=`)[1]?.split(";")[0];
    const session = await verifySessionToken(decodeURIComponent(token ?? ""));
    expect(session?.sub).toBe("admin");
  });

  it("renvoie 401 avec un mot de passe incorrect", async () => {
    const response = await login(
      loginRequest({ password: "mauvais-mot-de-passe" }, "10.0.0.11"),
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("renvoie 400 si le mot de passe est absent", async () => {
    const response = await login(loginRequest({}, "10.0.0.12"));
    expect(response.status).toBe(400);
  });
});
