import { NextResponse } from "next/server";
import { loginSchema } from "@/shared/schemas";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  sessionCookieOptions,
  validateAdminPassword,
} from "@/backend/auth/adminSession";
import { clientIpFromHeaders, createRateLimiter } from "@/backend/auth/rateLimit";

// Limiteur anti-brute-force du login : 10 tentatives / minute / IP. Best-effort
// en mémoire (singleton au niveau du module) — voir la limite serverless
// documentée dans `rateLimit.ts` et docs/security.md.
const loginRateLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

// Route backend de connexion administrateur (voir docs/security.md).
//
// POST { password } → limite le débit par IP, valide la forme (loginSchema),
// compare le mot de passe à `ADMIN_PASSWORD` (temps constant), puis pose un
// cookie de session signé HMAC. 200 si succès, 401 si mot de passe incorrect,
// 400 si entrée mal formée, 429 si trop de tentatives.
export async function POST(request: Request) {
  const rate = loginRateLimiter.consume(clientIpFromHeaders(request.headers));
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Le mot de passe est requis." }, { status: 400 });
  }

  const valid = await validateAdminPassword(parsed.data.password);
  if (!valid) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  return response;
}
