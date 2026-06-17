import * as React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { FormBuilder } from "@/frontend/components/builder/FormBuilder";
import type { FormBuilderInitialData } from "@/frontend/hooks/useFormBuilder";

// Tests unitaires du Form Builder : rendu (titre, statut, questions), actions
// selon le statut (Enregistrer / Publier / Copier le lien / Voir les réponses),
// validation locale, et persistance / publication. Le hook d'état `useFormBuilder`
// est RÉEL (logique non mockée) ; seules les FRONTIÈRES sont stubées de façon
// isolée et commentée : navigation Next, `fetch` (HTTP) et presse-papier.
const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const INITIAL: FormBuilderInitialData = {
  title: "Sondage soirée IA",
  description: "Votre avis sur l'événement",
  questions: [
    {
      label: "Quel est votre prénom ?",
      type: "SHORT_TEXT",
      required: true,
      options: [],
    },
  ],
};

function setClipboard(writeText: jest.Mock) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}

function setup(
  overrides: Partial<React.ComponentProps<typeof FormBuilder>> = {},
) {
  const props = {
    formId: "form-1",
    publicId: "pub-1",
    status: "DRAFT" as const,
    initialData: INITIAL,
    ...overrides,
  };
  renderWithTheme(<FormBuilder {...props} />);
  return props;
}

describe("FormBuilder (unitaire)", () => {
  beforeEach(() => {
    refresh.mockClear();
    global.fetch = jest.fn() as unknown as typeof fetch;
    setClipboard(jest.fn().mockResolvedValue(undefined));
  });

  it("affiche le titre, le statut et la question initiale", () => {
    setup();
    expect(screen.getByDisplayValue("Sondage soirée IA")).toBeInTheDocument();
    expect(screen.getByText("Brouillon")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Quel est votre prénom ?"),
    ).toBeInTheDocument();
  });

  it("affiche un état vide quand il n'y a aucune question", () => {
    setup({ initialData: { ...INITIAL, questions: [] } });
    expect(screen.getByText("Aucune question")).toBeInTheDocument();
  });

  it("propose « Publier » et masque les actions de publication pour un brouillon", () => {
    setup({ status: "DRAFT" });
    expect(screen.getByRole("button", { name: "Publier" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Copier le lien" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Voir les réponses" }),
    ).not.toBeInTheDocument();
  });

  it("expose « Copier le lien » et « Voir les réponses » pour un questionnaire publié", () => {
    setup({ status: "PUBLISHED" });
    expect(
      screen.getByRole("button", { name: "Copier le lien" }),
    ).toBeInTheDocument();
    // « Voir les réponses » est un Button avec `href` → rendu en lien (`<a>`).
    expect(
      screen.getByRole("link", { name: "Voir les réponses" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publier" })).toBeDisabled();
  });

  it("ajoute une question via la palette de types", () => {
    setup({ initialData: { ...INITIAL, questions: [] } });
    fireEvent.click(screen.getByRole("button", { name: /texte court/i }));
    expect(screen.queryByText("Aucune question")).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("Libellé de la question"),
    ).toBeInTheDocument();
  });

  it("bloque l'enregistrement et affiche une erreur si le titre est vide", async () => {
    setup();
    fireEvent.change(screen.getByDisplayValue("Sondage soirée IA"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(
      await screen.findByText("Le titre du questionnaire est requis."),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("enregistre via PATCH et confirme le succès", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/forms/form-1",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
    expect(
      await screen.findByText("Questionnaire enregistré."),
    ).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("remonte l'erreur serveur d'enregistrement", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Conflit de version." }),
    });
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(await screen.findByText("Conflit de version.")).toBeInTheDocument();
  });

  it("publie (enregistre puis PUBLISHED) et copie le lien public", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    setup({ status: "DRAFT" });

    fireEvent.click(screen.getByRole("button", { name: "Publier" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/forms/form-1/publish",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
    expect(
      await screen.findByText(/Questionnaire publié\./),
    ).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith("http://localhost/f/pub-1");
  });

  it("copie le lien public au clic sur « Copier le lien »", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    setup({ status: "PUBLISHED" });

    fireEvent.click(screen.getByRole("button", { name: "Copier le lien" }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("http://localhost/f/pub-1"),
    );
    expect(
      await screen.findByText("Lien copié dans le presse-papier."),
    ).toBeInTheDocument();
  });
});
