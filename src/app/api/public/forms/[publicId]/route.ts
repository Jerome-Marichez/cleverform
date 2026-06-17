import { NextResponse } from "next/server";

import {
  FormNotFoundError,
  FormNotPublishedError,
  getPublicForm,
} from "@/backend/response/responseService";

// Route BACKEND publique : lecture d'un questionnaire **publié** par son
// `publicId` (jeton opaque). Renvoie le DTO public (sans `id` interne).
//
//   GET /api/public/forms/[publicId]
//     200 → PublicForm
//     404 → questionnaire inexistant ou non publié (cause non divulguée)
//     500 → erreur interne
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await params;

  try {
    const form = await getPublicForm(publicId);
    return NextResponse.json(form);
  } catch (error) {
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
