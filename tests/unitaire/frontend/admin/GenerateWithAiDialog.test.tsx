import * as React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { GenerateWithAiDialog } from "@/frontend/components/admin/GenerateWithAiDialog";
import { MAX_AI_PROMPT_LENGTH } from "@/shared/schemas";

// Tests unitaires de GenerateWithAiDialog : rendu, validation du prompt requis et
// fermeture. L'appel réseau (`fetch`) est stubé : on vérifie le COMPORTEMENT de
// présentation (validation, état), pas l'intégration HTTP réelle. AUCUN appel réseau.

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("GenerateWithAiDialog (unitaire)", () => {
  beforeEach(() => {
    push.mockClear();
    // `fetch` ne doit pas être appelé tant que la validation échoue ; on le stube
    // par sécurité pour ne jamais toucher le réseau.
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  it("affiche le titre de la boîte de dialogue quand elle est ouverte", () => {
    renderWithTheme(<GenerateWithAiDialog open onClose={() => {}} />);
    expect(
      screen.getByRole("heading", { name: "Générer un questionnaire par IA" }),
    ).toBeInTheDocument();
  });

  it("n'affiche rien quand elle est fermée", () => {
    renderWithTheme(<GenerateWithAiDialog open={false} onClose={() => {}} />);
    expect(
      screen.queryByRole("heading", {
        name: "Générer un questionnaire par IA",
      }),
    ).not.toBeInTheDocument();
  });

  it("expose un champ de sujet", () => {
    renderWithTheme(<GenerateWithAiDialog open onClose={() => {}} />);
    expect(screen.getByLabelText(/Sujet du questionnaire/)).toBeInTheDocument();
  });

  it("désactive le bouton Générer tant que le sujet est vide", () => {
    renderWithTheme(<GenerateWithAiDialog open onClose={() => {}} />);
    expect(screen.getByRole("button", { name: /Générer/ })).toBeDisabled();
  });

  it("active le bouton Générer dès qu'un sujet est saisi", () => {
    renderWithTheme(<GenerateWithAiDialog open onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(/Sujet du questionnaire/), {
      target: { value: "Un quiz sur l'IA" },
    });
    expect(screen.getByRole("button", { name: /Générer/ })).toBeEnabled();
  });

  it("propose des exemples cliquables qui pré-remplissent le champ", () => {
    renderWithTheme(<GenerateWithAiDialog open onClose={() => {}} />);
    const example = screen.getByText(
      "Un questionnaire pour mon événement de ce soir sur le thème de l'IA",
    );
    fireEvent.click(example);
    const field = screen.getByLabelText(
      /Sujet du questionnaire/,
    ) as HTMLInputElement;
    expect(field.value).toBe(
      "Un questionnaire pour mon événement de ce soir sur le thème de l'IA",
    );
    // Le clic sur un exemple ne déclenche aucun appel réseau.
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it(`borne réellement le champ à ${MAX_AI_PROMPT_LENGTH} caractères (maxLength)`, () => {
    renderWithTheme(<GenerateWithAiDialog open onClose={() => {}} />);
    const field = screen.getByLabelText(
      /Sujet du questionnaire/,
    ) as HTMLTextAreaElement;
    expect(field.maxLength).toBe(MAX_AI_PROMPT_LENGTH);
  });

  it("affiche un compteur de caractères qui suit la saisie", () => {
    renderWithTheme(<GenerateWithAiDialog open onClose={() => {}} />);
    expect(screen.getByText(`0 / ${MAX_AI_PROMPT_LENGTH}`)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Sujet du questionnaire/), {
      target: { value: "IA" },
    });
    expect(screen.getByText(`2 / ${MAX_AI_PROMPT_LENGTH}`)).toBeInTheDocument();
  });

  it("déclenche onClose au clic sur Annuler", () => {
    const onClose = jest.fn();
    renderWithTheme(<GenerateWithAiDialog open onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("signale le sujet requis après blur sans appel réseau", async () => {
    renderWithTheme(<GenerateWithAiDialog open onClose={() => {}} />);
    fireEvent.blur(screen.getByLabelText(/Sujet du questionnaire/));
    expect(
      await screen.findByText("Le sujet du questionnaire est requis."),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
