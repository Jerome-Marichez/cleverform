import { GET as responsesRoute } from "@/app/api/admin/forms/[id]/responses/route";
import { createForm, publishForm } from "@/backend/form/formService";
import { submitResponse } from "@/backend/response/responseService";
import { resetDatabase, disconnectDatabase } from "../helpers/db";

// Test d'intégration — lecture agrégée des réponses (Response Viewer admin) :
// `/api/admin/forms/[id]/responses`. Seed réel (création + publication +
// soumissions via les services), puis lecture via le Route Handler. Route →
// service → mapper d'agrégation → Prisma → Postgres de test.

const FORM_INPUT = {
  title: "Satisfaction",
  questions: [
    {
      label: "Note de l'événement",
      type: "RATING",
      required: true,
      order: 0,
    },
  ],
};

function paramsFor(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(resetDatabase);
afterAll(disconnectDatabase);

describe("GET /api/admin/forms/[id]/responses (intégration)", () => {
  it("renvoie l'agrégat et la liste des réponses soumises", async () => {
    const form = await createForm(FORM_INPUT);
    await publishForm(form.id);
    const ratingQuestionId = form.questions[0].id;

    await submitResponse(form.publicId, {
      answers: [{ questionId: ratingQuestionId, value: "4" }],
    });
    await submitResponse(form.publicId, {
      answers: [{ questionId: ratingQuestionId, value: "2" }],
    });

    const response = await responsesRoute(
      new Request("http://localhost"),
      paramsFor(form.id),
    );
    expect(response.status).toBe(200);

    const { aggregate, responses } = await response.json();
    expect(responses).toHaveLength(2);
    expect(aggregate.publicId).toBe(form.publicId);
    expect(aggregate.questions).toHaveLength(1);
  });

  it("renvoie une liste vide quand le questionnaire n'a aucune réponse", async () => {
    const form = await createForm(FORM_INPUT);
    await publishForm(form.id);

    const response = await responsesRoute(
      new Request("http://localhost"),
      paramsFor(form.id),
    );
    expect(response.status).toBe(200);
    const { responses } = await response.json();
    expect(responses).toEqual([]);
  });

  it("renvoie 404 pour un questionnaire inexistant", async () => {
    const response = await responsesRoute(
      new Request("http://localhost"),
      paramsFor("inexistant"),
    );
    expect(response.status).toBe(404);
  });
});
