import { NextResponse, type NextRequest } from "next/server";

import { proofread } from "@/backend/ai/aiService";
import { toAiErrorResponse } from "@/backend/ai/aiHttp";
import { requireAdmin } from "@/backend/auth/requireAdmin";
import { aiProofreadSchema } from "@/shared/schemas";

// Route backend ADMIN — correction orthographique/grammaticale par IA (Partie 4).
//
// Protégée par `middleware.ts` ; vérification de session rejouée ici (défense en
// profondeur). Corps : `{ text }`. Renvoie `{ corrected }`.

/** POST /api/admin/ai/proofread — corrige l'orthographe/grammaire d'un texte. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json().catch(() => null);
    const { text } = aiProofreadSchema.parse(body);
    const corrected = await proofread(text);
    return NextResponse.json({ corrected });
  } catch (error) {
    return toAiErrorResponse(error);
  }
}
