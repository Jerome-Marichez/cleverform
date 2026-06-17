import { GET as publicFormRoute } from "@/app/api/public/forms/[publicId]/route";
import { POST as submitRoute } from "@/app/api/public/forms/[publicId]/responses/route";
import { createForm, publishForm } from "@/backend/form/formService";
import { db } from "@/backend/db";
import { resetDatabase, disconnectDatabase } from "../helpers/db";
import type { FormWithRelations } from "@/backend/form/formRepository";

// Tests d'intégration — flux PUBLIC de bout en bout (Form Responder) :
// lecture d'un questionnaire publié et soumission de réponses. Route → service →
// Prisma → Postgres de test. Cloisonnement de sécurité vérifié sur données
// réelles : l'`id` interne ne fuite jamais, un brouillon est introuvable.

const FORM_INPUT = {
  title: "Avis sur la soirée",
  description: "Deux questions",
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

function paramsFor(publicId: string) {
  return { params: Promise.resolve({ publicId }) };
}

function submitRequest(publicId: string, body: unknown): Request {
  return new Request(`http://localhost/api/public/forms/${publicId}/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Crée puis publie un questionnaire ; renvoie le Form complet (ids réels). */
async function seedPublishedForm(): Promise<FormWithRelations> {
  const form = await createForm(FORM_INPUT);
  await publishForm(form.id);
  return form;
}

beforeEach(resetDatabase);
afterAll(disconnectDatabase);

describe("GET /api/public/forms/[publicId] (intégration)", () => {
  it("sert un questionnaire publié sans jamais exposer l'id interne", async () => {
    const form = await seedPublishedForm();
    const response = await publicFormRoute(
      new Request("http://localhost"),
      paramsFor(form.publicId),
    );
    expect(response.status).toBe(200);

    const dto = await response.json();
    expect(dto.publicId).toBe(form.publicId);
    expect(dto.title).toBe("Avis sur la soirée");
    expect(dto.questions).toHaveLength(2);
    // Frontière de sécurité : l'id interne du Form ne doit pas apparaître.
    expect(dto.id).toBeUndefined();
    expect(JSON.stringify(dto)).not.toContain(form.id);
  });

  it("renvoie 404 pour un questionnaire en brouillon (non publié)", async () => {
    const draft = await createForm(FORM_INPUT); // reste DRAFT
    const response = await publicFormRoute(
      new Request("http://localhost"),
      paramsFor(draft.publicId),
    );
    expect(response.status).toBe(404);
  });

  it("renvoie 404 pour un publicId inconnu", async () => {
    const response = await publicFormRoute(
      new Request("http://localhost"),
      paramsFor("jeton-inexistant"),
    );
    expect(response.status).toBe(404);
  });
});

describe("POST /api/public/forms/[publicId]/responses (intégration)", () => {
  it("enregistre une soumission valide et la persiste (201)", async () => {
    const form = await seedPublishedForm();
    const requiredQuestionId = form.questions[0].id;
    const choiceQuestion = form.questions[1];

    const response = await submitRoute(
      submitRequest(form.publicId, {
        answers: [
          { questionId: requiredQuestionId, value: "Jean" },
          {
            questionId: choiceQuestion.id,
            selectedOptionIds: [choiceQuestion.options[0].id],
          },
        ],
      }),
      paramsFor(form.publicId),
    );
    expect(response.status).toBe(201);

    const created = await response.json();
    expect(created.id).toBeTruthy();

    // Persistance réelle : une Response et ses Answers existent en base.
    const stored = await db.response.findUnique({
      where: { id: created.id },
      include: { answers: true },
    });
    expect(stored).not.toBeNull();
    expect(stored!.formId).toBe(form.id);
    expect(stored!.answers.length).toBeGreaterThanOrEqual(1);
  });

  it("rejette une soumission sans réponse à une question obligatoire (400)", async () => {
    const form = await seedPublishedForm();
    const choiceQuestion = form.questions[1];

    const response = await submitRoute(
      submitRequest(form.publicId, {
        answers: [
          {
            questionId: choiceQuestion.id,
            selectedOptionIds: [choiceQuestion.options[0].id],
          },
        ],
      }),
      paramsFor(form.publicId),
    );
    expect(response.status).toBe(400);
    expect(await db.response.count()).toBe(0);
  });

  it("rejette un corps JSON invalide (400)", async () => {
    const form = await seedPublishedForm();
    const badRequest = new Request(
      `http://localhost/api/public/forms/${form.publicId}/responses`,
      { method: "POST", body: "pas-du-json" },
    );
    const response = await submitRoute(badRequest, paramsFor(form.publicId));
    expect(response.status).toBe(400);
  });

  it("refuse une soumission sur un questionnaire non publié (404)", async () => {
    const draft = await createForm(FORM_INPUT);
    const response = await submitRoute(
      submitRequest(draft.publicId, {
        answers: [{ questionId: draft.questions[0].id, value: "Jean" }],
      }),
      paramsFor(draft.publicId),
    );
    expect(response.status).toBe(404);
  });
});
