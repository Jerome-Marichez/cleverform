// Traduction des erreurs de la couche IA en réponses HTTP (Route Handlers admin).
//
// Mapping cause → code HTTP, dans le prolongement de `formHttp.ts` :
//  - UnauthorizedError   → 401 (session admin absente/invalide) ;
//  - ZodError            → 400 (entrée invalide, ex. prompt vide) + détail ;
//  - AiGenerationError   → 502 (l'IA a renvoyé un format inexploitable) ;
//  - MissingApiKeyError  → 503 (assistance IA non configurée / indisponible) ;
//  - autre               → 500 (erreur inattendue, journalisée).

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AiUnavailableError, MissingApiKeyError } from "@/backend/ai/aiClient";
import { AiGenerationError } from "@/backend/ai/aiErrors";
import { UnauthorizedError } from "@/backend/auth/requireAdmin";

/** Construit une réponse JSON d'erreur uniforme `{ error, details? }`. */
function errorResponse(status: number, message: string, details?: unknown) {
  return NextResponse.json(
    details === undefined ? { error: message } : { error: message, details },
    { status },
  );
}

/**
 * Traduit une erreur de la couche IA en `NextResponse`. Toute erreur non
 * identifiée est journalisée et renvoyée en 500 (sans fuite de détail interne).
 */
export function toAiErrorResponse(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return errorResponse(401, error.message);
  }
  if (error instanceof ZodError) {
    return errorResponse(400, "Données invalides.", error.issues);
  }
  if (error instanceof MissingApiKeyError || error instanceof AiUnavailableError) {
    return errorResponse(503, "L'assistance IA est indisponible pour le moment.");
  }
  if (error instanceof AiGenerationError) {
    return errorResponse(
      502,
      "L'IA a renvoyé une réponse inexploitable. Réessayez ou reformulez.",
    );
  }

  console.error("[api/admin/ai] erreur inattendue :", error);
  return errorResponse(500, "Une erreur interne est survenue.");
}
