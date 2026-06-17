import { NextResponse } from "next/server";

import {
  getFormResponsesAggregated,
  listResponses,
} from "@/backend/response/responseService";

// Route BACKEND admin : lecture des réponses d'un questionnaire (par `id`
// interne), pour le Response Viewer. Sous la garde admin du middleware
// (/api/admin/* — voir docs/security.md).
//
//   GET /api/admin/forms/[id]/responses
//     200 → { aggregate, responses } (agrégat par question + liste brute)
//     404 → questionnaire inexistant
//     500 → erreur interne
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const aggregate = await getFormResponsesAggregated(id);
    if (!aggregate) {
      return NextResponse.json(
        { error: "Questionnaire introuvable." },
        { status: 404 },
      );
    }
    const responses = await listResponses(id);
    return NextResponse.json({ aggregate, responses });
  } catch {
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 },
    );
  }
}
