import { NextRequest } from "next/server";
import {
  PATCH as updateFormRoute,
  DELETE as deleteFormRoute,
} from "@/app/api/admin/forms/[id]/route";
import { PATCH as publishRoute } from "@/app/api/admin/forms/[id]/publish/route";
import { createForm } from "@/backend/form/formService";
import { db } from "@/backend/db";
import { resetDatabase, disconnectDatabase } from "../helpers/db";

// Tests d'intégration — cycle de vie d'un questionnaire via les Route Handlers
// `/api/admin/forms/[id]` (PATCH, DELETE) et `[id]/publish` (transition de statut).
// Route → service → Prisma → Postgres de test. Le questionnaire est amorcé par le
// VRAI service `createForm` (pas de fixture mockée).

const BASE_FORM = {
  title: "Sondage initial",
  questions: [
    { label: "Question 1", type: "SHORT_TEXT", required: false, order: 0 },
  ],
};

function paramsFor(id: string) {
  return { params: Promise.resolve({ id }) };
}

function jsonRequest(url: string, method: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function seedForm() {
  return createForm(BASE_FORM);
}

beforeEach(resetDatabase);
afterAll(disconnectDatabase);

describe("PATCH /api/admin/forms/[id] (intégration)", () => {
  it("met à jour le titre et remplace les questions", async () => {
    const form = await seedForm();
    const response = await updateFormRoute(
      jsonRequest(`http://localhost/api/admin/forms/${form.id}`, "PATCH", {
        title: "Sondage mis à jour",
        questions: [
          { label: "Nouvelle question", type: "LONG_TEXT", required: true, order: 0 },
        ],
      }),
      paramsFor(form.id),
    );
    expect(response.status).toBe(200);

    const inDb = await db.form.findUnique({
      where: { id: form.id },
      include: { questions: true },
    });
    expect(inDb!.title).toBe("Sondage mis à jour");
    expect(inDb!.questions).toHaveLength(1);
    expect(inDb!.questions[0].label).toBe("Nouvelle question");
    expect(inDb!.questions[0].type).toBe("LONG_TEXT");
  });

  it("renvoie 404 pour un questionnaire inexistant", async () => {
    const response = await updateFormRoute(
      jsonRequest("http://localhost/api/admin/forms/inexistant", "PATCH", {
        title: "x",
        questions: [
          { label: "Q", type: "SHORT_TEXT", required: false, order: 0 },
        ],
      }),
      paramsFor("inexistant"),
    );
    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/admin/forms/[id]/publish (intégration)", () => {
  it("publie un brouillon (DRAFT → PUBLISHED)", async () => {
    const form = await seedForm();
    const response = await publishRoute(
      jsonRequest(
        `http://localhost/api/admin/forms/${form.id}/publish`,
        "PATCH",
        { status: "PUBLISHED" },
      ),
      paramsFor(form.id),
    );
    expect(response.status).toBe(200);
    const updated = await db.form.findUnique({ where: { id: form.id } });
    expect(updated!.status).toBe("PUBLISHED");
  });

  it("refuse une transition illégale en 409 (DRAFT → CLOSED)", async () => {
    const form = await seedForm();
    const response = await publishRoute(
      jsonRequest(
        `http://localhost/api/admin/forms/${form.id}/publish`,
        "PATCH",
        { status: "CLOSED" },
      ),
      paramsFor(form.id),
    );
    expect(response.status).toBe(409);
    const unchanged = await db.form.findUnique({ where: { id: form.id } });
    expect(unchanged!.status).toBe("DRAFT");
  });
});

describe("DELETE /api/admin/forms/[id] (intégration)", () => {
  it("supprime le questionnaire et ses dépendances (204)", async () => {
    const form = await seedForm();
    const response = await deleteFormRoute(
      new NextRequest(`http://localhost/api/admin/forms/${form.id}`, {
        method: "DELETE",
      }),
      paramsFor(form.id),
    );
    expect(response.status).toBe(204);
    expect(await db.form.count()).toBe(0);
    expect(await db.question.count()).toBe(0);
  });

  it("renvoie 404 à la suppression d'un questionnaire inexistant", async () => {
    const response = await deleteFormRoute(
      new NextRequest("http://localhost/api/admin/forms/inexistant", {
        method: "DELETE",
      }),
      paramsFor("inexistant"),
    );
    expect(response.status).toBe(404);
  });
});
