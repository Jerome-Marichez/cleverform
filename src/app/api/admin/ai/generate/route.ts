import { NextResponse, type NextRequest } from "next/server";

import { generateForm } from "@/backend/ai/aiService";
import { toAiErrorResponse } from "@/backend/ai/aiHttp";
import { requireAdmin } from "@/backend/auth/requireAdmin";
import { aiGenerateSchema } from "@/shared/schemas";

// Route backend ADMIN — génération d'un questionnaire par IA (Partie 4).
//
// Protégée par `middleware.ts` ; on rejoue la vérification de session ici
// (défense en profondeur) car cette route déclenche un appel externe coûteux.
// Corps : `{ prompt }`. Renvoie le questionnaire créé (201).

/** POST /api/admin/ai/generate — crée un questionnaire à partir d'un prompt. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json().catch(() => null);
    const { prompt } = aiGenerateSchema.parse(body);
    const form = await generateForm(prompt);
    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    return toAiErrorResponse(error);
  }
}
