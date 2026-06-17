import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/backend/auth/adminSession";

// Garde d'accès à l'espace administrateur (voir docs/security.md).
//
// S'applique à `/admin/*` (UI) et `/api/admin/*` (Route Handlers). En l'absence
// d'une session admin valide :
//   - API   (`/api/admin/*`) → 401 JSON (pas de redirection : appel programmatique).
//   - Pages (`/admin/*`)     → redirection 302 vers `/login?from=<chemin demandé>`.
//
// La vérification s'appuie sur la Web Crypto API (voir adminSession.ts), compatible
// avec le runtime du middleware. La défense est **rejouée côté backend** (defense-in-depth) :
// on ne se repose pas uniquement sur ce middleware.
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (session) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json(
      { error: "Authentification requise." },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
