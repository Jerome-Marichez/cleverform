import { NextRequest } from "next/server";
import { GET as listFormsRoute, POST as createFormRoute } from "@/app/api/admin/forms/route";
import { db } from "@/backend/db";
import { resetDatabase, disconnectDatabase } from "../helpers/db";

// Tests d'intégration — collection admin des questionnaires (`/api/admin/forms`).
// Exerce les VRAIS Route Handlers → service → Prisma → Postgres de test. Données
// d'exemple réelles persistées en base ; aucun mock.

const VALID_FORM = {
  title: "Inscription événement IA",
  description: "Quelques questions rapides",
  questions: [
    { label: "Votre prénom ?", type: "SHORT_TEXT", required: true, order: 0 },
    {
      label: "Couleur préférée ?",
      type: "SINGLE_CHOICE",
      required: false,
      order: 1,
      options: [
        { label: "Bleu", order: 0 },
        { label: "Rouge", order: 1 },
      ],
    },
  ],
};

function postForm(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/forms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(resetDatabase);
afterAll(disconnectDatabase);

describe("POST /api/admin/forms (intégration)", () => {
  it("crée un questionnaire et le persiste en base", async () => {
    const response = await createFormRoute(postForm(VALID_FORM));
    expect(response.status).toBe(201);

    const created = await response.json();
    expect(created.id).toBeTruthy();
    expect(created.publicId).toBeTruthy();
    expect(created.status).toBe("DRAFT");
    expect(created.questions).toHaveLength(2);

    // Vérification directe en base : la ligne et ses relations existent vraiment.
    const inDb = await db.form.findUnique({
      where: { id: created.id },
      include: { questions: { include: { options: true } } },
    });
    expect(inDb).not.toBeNull();
    expect(inDb!.questions).toHaveLength(2);
    const choice = inDb!.questions.find((q) => q.type === "SINGLE_CHOICE");
    expect(choice!.options).toHaveLength(2);
  });

  it("rejette un titre vide en 400 (validation Zod)", async () => {
    const response = await createFormRoute(
      postForm({ ...VALID_FORM, title: "   " }),
    );
    expect(response.status).toBe(400);
    expect(await db.form.count()).toBe(0);
  });

  it("rejette un questionnaire sans question en 400", async () => {
    const response = await createFormRoute(postForm({ title: "Vide", questions: [] }));
    expect(response.status).toBe(400);
  });
});

describe("GET /api/admin/forms (intégration)", () => {
  it("liste les questionnaires créés, les plus récents d'abord", async () => {
    await createFormRoute(postForm({ ...VALID_FORM, title: "Premier" }));
    await createFormRoute(postForm({ ...VALID_FORM, title: "Second" }));

    const response = await listFormsRoute();
    expect(response.status).toBe(200);
    const forms = await response.json();
    expect(forms).toHaveLength(2);
    expect(forms.map((f: { title: string }) => f.title)).toEqual(
      expect.arrayContaining(["Premier", "Second"]),
    );
  });

  it("renvoie une liste vide quand aucun questionnaire n'existe", async () => {
    const response = await listFormsRoute();
    expect(await response.json()).toEqual([]);
  });
});
