import * as React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { ResponderForm } from "@/frontend/components/responder/ResponderForm";
import { ThankYouScreen } from "@/frontend/components/responder/ThankYouScreen";
import type { PublicForm } from "@/shared/schemas";

// Tests unitaires du Form Responder côté client : rendu des questions et
// validation client à la soumission. Le réseau réel n'est jamais appelé — `fetch`
// est remplacé par une fonction sous contrôle pour vérifier le succès, sans DB.

const fixtureForm: PublicForm = {
  publicId: "pub-123",
  title: "Soirée IA",
  description: "Donnez-nous votre avis sur l'événement.",
  status: "PUBLISHED",
  questions: [
    {
      id: "q-name",
      label: "Votre nom",
      type: "SHORT_TEXT",
      required: true,
      order: 0,
      options: [],
    },
    {
      id: "q-theme",
      label: "Thèmes préférés",
      type: "MULTIPLE_CHOICE",
      required: false,
      order: 1,
      options: [
        { id: "o-ia", label: "IA", order: 0 },
        { id: "o-web", label: "Web", order: 1 },
      ],
    },
  ],
};

// `fetch` (et `Response`) ne sont pas fournis par jsdom : on branche `fetch` sur
// un mock contrôlé renvoyant une réponse factice minimale (seules `ok` et
// `json()` sont lues par le composant). On n'appelle donc jamais le réseau réel
// ni la DB — on vérifie le rendu, la validation client et la forme du corps.
const originalFetch = global.fetch;

interface FakeResponse {
  ok: boolean;
  json: () => Promise<unknown>;
}

function fakeResponse(status: number, body: unknown): FakeResponse {
  return { ok: status >= 200 && status < 300, json: () => Promise.resolve(body) };
}

function mockFetch(response: FakeResponse): jest.Mock {
  const fetchMock = jest.fn<Promise<FakeResponse>, [RequestInfo | URL, RequestInit?]>(
    () => Promise.resolve(response),
  );
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

/** Coche la case de consentement RGPD (prérequis à l'envoi). */
function giveConsent() {
  fireEvent.click(
    screen.getByRole("checkbox", { name: /je consens au traitement/i }),
  );
}

describe("ResponderForm (unitaire)", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("affiche le titre, la description et les questions du questionnaire", () => {
    renderWithTheme(<ResponderForm form={fixtureForm} />);

    expect(
      screen.getByRole("heading", { name: "Soirée IA" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Donnez-nous votre avis sur l'événement."),
    ).toBeInTheDocument();
    expect(screen.getByText("Votre nom")).toBeInTheDocument();
    expect(screen.getByText("Thèmes préférés")).toBeInTheDocument();
    // Les options du choix multiple sont rendues comme cases à cocher.
    expect(screen.getByRole("checkbox", { name: "IA" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Web" })).toBeInTheDocument();
  });

  it("affiche une erreur de validation client quand une question requise est vide", async () => {
    const fetchMock = mockFetch(fakeResponse(201, { id: "r1" }));
    renderWithTheme(<ResponderForm form={fixtureForm} />);

    // On consent (sinon le verrou RGPD bloque avant la validation des champs),
    // puis on envoie sans renseigner la question requise.
    giveConsent();
    fireEvent.click(
      screen.getByRole("button", { name: /envoyer mes réponses/i }),
    );

    await waitFor(() => {
      expect(screen.getByText("Cette question est obligatoire.")).toBeInTheDocument();
    });
    // La validation client bloque l'envoi : aucun appel réseau n'est tenté.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envoie la soumission et affiche l'écran de remerciement en cas de succès", async () => {
    const fetchMock = mockFetch(
      fakeResponse(201, { id: "r1", submittedAt: new Date().toISOString() }),
    );

    renderWithTheme(<ResponderForm form={fixtureForm} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Alice" },
    });
    giveConsent();
    fireEvent.click(
      screen.getByRole("button", { name: /envoyer mes réponses/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Merci pour votre réponse !"),
      ).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/public/forms/pub-123/responses");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    // Le corps respecte la forme SubmitResponseInput attendue par le backend :
    // un AnswerInput par question, dans l'ordre. La question de choix multiple,
    // facultative et non touchée, conserve sa valeur par défaut (sans option).
    expect(body.answers).toEqual([
      { questionId: "q-name", value: "Alice" },
      { questionId: "q-theme" },
    ]);
  });

  it("affiche le message d'erreur serveur (issues) en cas d'échec", async () => {
    mockFetch(
      fakeResponse(400, {
        error: "La soumission est invalide.",
        issues: ["Cette question est obligatoire."],
      }),
    );

    renderWithTheme(<ResponderForm form={fixtureForm} />);

    // On renseigne le champ requis et on consent pour passer la validation
    // client et atteindre le serveur (simulé) qui renvoie une erreur.
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Alice" },
    });
    giveConsent();
    fireEvent.click(
      screen.getByRole("button", { name: /envoyer mes réponses/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Cette question est obligatoire.",
      );
    });
    expect(screen.queryByText("Merci pour votre réponse !")).not.toBeInTheDocument();
  });

  it("affiche la mention de confidentialité (RGPD)", () => {
    renderWithTheme(<ResponderForm form={fixtureForm} />);
    expect(
      screen.getByRole("region", { name: /confidentialité/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Jérôme Marichez/)).toBeInTheDocument();
  });

  it("bloque l'envoi sans consentement et n'appelle pas le réseau", async () => {
    const fetchMock = mockFetch(fakeResponse(201, { id: "r1" }));
    renderWithTheme(<ResponderForm form={fixtureForm} />);

    // Champ requis renseigné mais consentement non coché.
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Alice" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /envoyer mes réponses/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/vous devez accepter le traitement/i),
      ).toBeInTheDocument();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("ThankYouScreen (unitaire)", () => {
  it("affiche le remerciement et rappelle le titre du questionnaire", () => {
    renderWithTheme(<ThankYouScreen title="Soirée IA" />);
    expect(screen.getByText("Merci pour votre réponse !")).toBeInTheDocument();
    expect(screen.getByText(/Soirée IA/)).toBeInTheDocument();
  });
});
