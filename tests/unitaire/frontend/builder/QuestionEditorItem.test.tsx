import * as React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { renderWithTheme } from "../renderWithTheme";
import { QuestionEditorItem } from "@/frontend/components/builder/QuestionEditorItem";
import type { BuilderQuestion } from "@/frontend/hooks/useFormBuilder";

// Tests unitaires de QuestionEditorItem : libellé, type, switch obligatoire,
// suppression, éditeur d'options selon le type, et action de correction IA.
// Les handlers sont des spies (`jest.fn`) — pas des mocks de dépendance. Le
// composant est monté dans son contexte dnd-kit réel (DndContext + Sortable).

const TEXT_QUESTION: BuilderQuestion = {
  localId: "q1",
  label: "Quel est votre prénom ?",
  type: "SHORT_TEXT",
  required: false,
  options: [],
};

const CHOICE_QUESTION: BuilderQuestion = {
  localId: "q2",
  label: "Couleur préférée ?",
  type: "SINGLE_CHOICE",
  required: true,
  options: [
    { localId: "o1", label: "Bleu" },
    { localId: "o2", label: "Rouge" },
  ],
};

function setup(
  overrides: Partial<React.ComponentProps<typeof QuestionEditorItem>> = {},
) {
  const props = {
    question: TEXT_QUESTION,
    index: 1,
    onChangeLabel: jest.fn(),
    onToggleRequired: jest.fn(),
    onRemove: jest.fn(),
    onAddOption: jest.fn(),
    onRemoveOption: jest.fn(),
    onChangeOptionLabel: jest.fn(),
    onReorderOptions: jest.fn(),
    ...overrides,
  };
  renderWithTheme(
    <DndContext>
      <SortableContext items={[props.question.localId]}>
        <QuestionEditorItem {...props} />
      </SortableContext>
    </DndContext>,
  );
  return props;
}

describe("QuestionEditorItem (unitaire)", () => {
  it("affiche la position, le libellé et le type de la question", () => {
    setup();
    expect(screen.getByText("1.")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Quel est votre prénom ?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Texte court")).toBeInTheDocument();
  });

  it("appelle onChangeLabel avec la nouvelle valeur saisie", () => {
    const props = setup();
    fireEvent.change(screen.getByLabelText("Libellé de la question"), {
      target: { value: "Votre nom ?" },
    });
    expect(props.onChangeLabel).toHaveBeenCalledWith("Votre nom ?");
  });

  it("appelle onToggleRequired quand on bascule « obligatoire »", () => {
    const props = setup();
    fireEvent.click(screen.getByRole("switch", { name: "Réponse obligatoire" }));
    expect(props.onToggleRequired).toHaveBeenCalledWith(true);
  });

  it("appelle onRemove au clic sur « Supprimer la question »", () => {
    const props = setup();
    fireEvent.click(
      screen.getByRole("button", { name: "Supprimer la question" }),
    );
    expect(props.onRemove).toHaveBeenCalledTimes(1);
  });

  it("n'affiche pas d'éditeur d'options pour un type scalaire", () => {
    setup();
    expect(
      screen.queryByRole("button", { name: /ajouter une option/i }),
    ).not.toBeInTheDocument();
  });

  it("affiche l'éditeur d'options pour un type à choix", () => {
    setup({ question: CHOICE_QUESTION });
    expect(screen.getByDisplayValue("Bleu")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ajouter une option/i }),
    ).toBeInTheDocument();
  });

  it("désactive le libellé et la suppression quand `disabled`", () => {
    setup({ disabled: true });
    expect(screen.getByLabelText("Libellé de la question")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Supprimer la question" }),
    ).toBeDisabled();
  });

  describe("correction IA du libellé", () => {
    it("n'affiche pas l'action de correction sans handler onProofreadLabel", () => {
      setup();
      expect(
        screen.queryByRole("button", {
          name: "Corriger l'orthographe du libellé",
        }),
      ).not.toBeInTheDocument();
    });

    it("appelle onProofreadLabel au clic quand le libellé n'est pas vide", () => {
      const onProofreadLabel = jest.fn();
      setup({ onProofreadLabel });
      fireEvent.click(
        screen.getByRole("button", {
          name: "Corriger l'orthographe du libellé",
        }),
      );
      expect(onProofreadLabel).toHaveBeenCalledTimes(1);
    });

    it("désactive la correction quand le libellé est vide", () => {
      setup({
        question: { ...TEXT_QUESTION, label: "   " },
        onProofreadLabel: jest.fn(),
      });
      expect(
        screen.getByRole("button", {
          name: "Corriger l'orthographe du libellé",
        }),
      ).toBeDisabled();
    });

    it("désactive le champ et l'action pendant la correction (`proofreading`)", () => {
      setup({ onProofreadLabel: jest.fn(), proofreading: true });
      expect(screen.getByLabelText("Libellé de la question")).toBeDisabled();
      expect(
        screen.getByRole("button", {
          name: "Corriger l'orthographe du libellé",
        }),
      ).toBeDisabled();
    });
  });
});
