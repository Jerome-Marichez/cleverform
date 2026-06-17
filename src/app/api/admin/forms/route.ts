import { NextResponse, type NextRequest } from "next/server";

import { toErrorResponse } from "@/backend/form/formHttp";
import { createForm, listForms } from "@/backend/form/formService";

// Routes backend ADMIN — collection des questionnaires (Form Builder).
// L'authentification admin est assurée en amont par `middleware.ts` (voir
// docs/security.md) ; ces handlers se concentrent sur le métier et les erreurs.

/** GET /api/admin/forms — liste tous les questionnaires. */
export async function GET() {
  try {
    const forms = await listForms();
    return NextResponse.json(forms);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** POST /api/admin/forms — crée un questionnaire (body validé par createFormSchema). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const form = await createForm(body);
    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
