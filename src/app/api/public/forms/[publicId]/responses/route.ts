import { NextResponse } from "next/server";

import {
  FormNotFoundError,
  FormNotPublishedError,
  InvalidSubmissionError,
  submitResponse,
} from "@/backend/response/responseService";

// Route BACKEND publique : soumission de réponses à un questionnaire publié
// (surface **write-only** du public — voir docs/security.md).
//
//   POST /api/public/forms/[publicId]/responses
//     201 → { id, submittedAt } de la Response créée
//     400 → corps JSON invalide ou soumission non conforme (règles par type)
//     404 → questionnaire inexistant ou non publié
//     500 → erreur interne
export async function POST(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Le corps de la requête doit être un JSON valide." },
      { status: 400 },
    );
  }

  try {
    // La validation forte (forme + règles par type, via Zod paramétré par les
    // questions) est faite dans le service ; on lui passe le corps brut.
    const created = await submitResponse(
      publicId,
      body as Parameters<typeof submitResponse>[1],
    );
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidSubmissionError) {
      return NextResponse.json(
        { error: "La soumission est invalide.", issues: error.issues },
        { status: 400 },
      );
    }
    if (
      error instanceof FormNotFoundError ||
      error instanceof FormNotPublishedError
    ) {
      return NextResponse.json(
        { error: "Questionnaire introuvable." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 },
    );
  }
}
