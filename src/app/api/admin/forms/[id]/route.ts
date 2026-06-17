import { NextResponse, type NextRequest } from "next/server";

import { toErrorResponse } from "@/backend/form/formHttp";
import { deleteForm, getForm, updateForm } from "@/backend/form/formService";

// Routes backend ADMIN — questionnaire individuel (détail, mise à jour, suppression).
// Protégé par `middleware.ts`. En Next 16, les paramètres de route dynamique sont
// asynchrones (`params` est une Promise).

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/admin/forms/[id] — détail d'un questionnaire. */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const form = await getForm(id);
    return NextResponse.json(form);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** PATCH /api/admin/forms/[id] — mise à jour (body validé par updateFormSchema). */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const form = await updateForm(id, body);
    return NextResponse.json(form);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** DELETE /api/admin/forms/[id] — suppression (cascade questions/options/réponses). */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    await deleteForm(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
