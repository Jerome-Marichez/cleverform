// Traduction des erreurs de la couche Form en réponses HTTP (Route Handlers admin).
//
// Centralise le mapping cause → code HTTP pour que chaque route reste minimale :
//  - ZodError                      → 400 (entrée invalide) + détail des champs ;
//  - FormNotFoundError             → 404 ;
//  - InvalidStatusTransitionError  → 409 (conflit d'état) ;
//  - autre                         → 500 (erreur inattendue, journalisée).

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  FormNotFoundError,
  InvalidStatusTransitionError,
} from "@/backend/form/formErrors";

/** Construit une réponse JSON d'erreur uniforme `{ error, details? }`. */
function errorResponse(status: number, message: string, details?: unknown) {
  return NextResponse.json(
    details === undefined ? { error: message } : { error: message, details },
    { status },
  );
}

/**
 * Traduit une erreur levée par le service en `NextResponse` adaptée. Toute erreur
 * non métier est journalisée et renvoyée en 500 (sans fuite de détail interne).
 */
export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return errorResponse(400, "Données invalides.", error.issues);
  }
  if (error instanceof FormNotFoundError) {
    return errorResponse(404, error.message);
  }
  if (error instanceof InvalidStatusTransitionError) {
    return errorResponse(409, error.message);
  }

  console.error("[api/admin/forms] erreur inattendue :", error);
  return errorResponse(500, "Une erreur interne est survenue.");
}
