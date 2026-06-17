import { NextResponse } from "next/server";
import { loginSchema } from "@/shared/schemas";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  sessionCookieOptions,
  validateAdminPassword,
} from "@/backend/auth/adminSession";

// Route backend de connexion administrateur (voir docs/security.md).
//
// POST { password } → valide la forme (loginSchema), compare le mot de passe à
// `ADMIN_PASSWORD` (temps constant), puis pose un cookie de session signé HMAC.
// 200 si succès, 401 si mot de passe incorrect, 400 si entrée mal formée.
export async function POST(request: Request) {
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
