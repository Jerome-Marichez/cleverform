import { GET as healthRoute } from "@/app/api/health/route";
import { POST as logoutRoute } from "@/app/api/auth/logout/route";
import { SESSION_COOKIE_NAME } from "@/backend/auth/adminSession";

// Test d'intégration — routes système simples (sans BDD) : santé et déconnexion.
// On exerce les VRAIS Route Handlers.

describe("GET /api/health (intégration)", () => {
  it("répond 200 avec un statut « ok »", async () => {
    const response = await healthRoute();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});

describe("POST /api/auth/logout (intégration)", () => {
  it("efface le cookie de session (maxAge=0) et répond 200", async () => {
    const response = await logoutRoute();
    expect(response.status).toBe(200);

    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie.toLowerCase()).toContain("max-age=0");
  });
});
