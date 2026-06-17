import { NextResponse, type NextRequest } from "next/server";

import { toErrorResponse } from "@/backend/form/formHttp";
import { changeFormStatus } from "@/backend/form/formService";

// Route backend ADMIN — changement de statut d'un questionnaire (publication /
// clôture). Protégée par `middleware.ts`.
//
// Le corps est OPTIONNEL : `{ status: "PUBLISHED" | "CLOSED" }`. Par défaut (corps
// absent ou vide), on publie (DRAFT → PUBLISHED). Les transitions illégales sont
// rejetées par le service (409). PATCH et POST sont acceptés (sémantiquement, une
// publication est une mise à jour idempotente du statut).

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Extrait le statut cible du corps (défaut : PUBLISHED), corps optionnel. */
async function resolveTargetStatus(request: NextRequest): Promise<unknown> {
  try {
    const body = (await request.json()) as { status?: unknown } | null;
    return body?.status ?? "PUBLISHED";
  } catch {
    // Corps absent ou non-JSON : on publie par défaut.
    return "PUBLISHED";
  }
}

async function handle(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const targetStatus = await resolveTargetStatus(request);
    const form = await changeFormStatus(id, targetStatus);
    return NextResponse.json(form);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** PATCH /api/admin/forms/[id]/publish — change le statut (publication / clôture). */
export function PATCH(request: NextRequest, context: RouteContext) {
  return handle(request, context);
}

/** POST /api/admin/forms/[id]/publish — alias de PATCH. */
export function POST(request: NextRequest, context: RouteContext) {
  return handle(request, context);
}
