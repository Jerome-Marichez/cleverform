import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  clearedSessionCookieOptions,
} from "@/backend/auth/adminSession";

// Route backend de déconnexion administrateur (voir docs/security.md).
//
// POST → efface le cookie de session (maxAge = 0). Toujours 200 (idempotent).
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", clearedSessionCookieOptions());
  return response;
}
