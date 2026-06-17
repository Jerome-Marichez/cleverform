// Vérification de session admin côté Route Handler (défense en profondeur).
//
// Les routes `/api/admin/*` sont déjà protégées par `src/middleware.ts`. On
// rejoue néanmoins la vérification ici afin de ne pas dépendre uniquement du
// middleware (defense-in-depth, voir docs/security.md). Les routes IA, qui
// déclenchent des appels externes coûteux, en bénéficient particulièrement.

import { type NextRequest } from "next/server";

import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/backend/auth/adminSession";

/** Erreur levée lorsqu'aucune session admin valide n'accompagne la requête. → 401 */
export class UnauthorizedError extends Error {
  constructor() {
    super("Authentification requise.");
    this.name = "UnauthorizedError";
  }
}

/**
 * Vérifie la présence d'une session admin valide sur la requête.
 * @throws UnauthorizedError si le cookie de session est absent ou invalide.
 */
export async function requireAdmin(request: NextRequest): Promise<void> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  if (!session) {
    throw new UnauthorizedError();
  }
}
