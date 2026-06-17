import * as React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { OptionsEditor } from "@/frontend/components/builder/OptionsEditor";
import type { BuilderOption } from "@/frontend/hooks/useFormBuilder";

// Tests unitaires de OptionsEditor : rendu des options et interactions simples
// (ajout, suppression, saisie). Le drag&drop réel n'est pas testé.

const OPTIONS: BuilderOption[] = [
  { localId: "o1", label: "Bleu" },
  { localId: "o2", label: "Rouge" },
];

function setup(overrides: Partial<React.ComponentProps<typeof OptionsEditor>> = {}) {
  const props = {
    options: OPTIONS,
    onAdd: jest.fn(),
    onRemove: jest.fn(),
    onChangeLabel: jest.fn(),
    onReorder: jest.fn(),
    ...overrides,
  };
  renderWithTheme(<OptionsEditor {...props} />);
  return props;
}

describe("OptionsEditor (unitaire)", () => {
  it("affiche un champ par option avec sa valeur", () => {
    setup();
    expect(screen.getByDisplayValue("Bleu")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Rouge")).toBeInTheDocument();
  });

  it("appelle onAdd au clic sur « Ajouter une option »", () => {
    const props = setup();
    fireEvent.click(screen.getByRole("button", { name: /ajouter une option/i }));
    expect(props.onAdd).toHaveBeenCalledTimes(1);
  });

  it("appelle onChangeLabel avec l'identifiant et la nouvelle valeur", () => {
    const props = setup();
    fireEvent.change(screen.getByDisplayValue("Bleu"), {
      target: { value: "Vert" },
    });
    expect(props.onChangeLabel).toHaveBeenCalledWith("o1", "Vert");
  });

  it("appelle onRemove au clic sur la suppression d'une option", () => {
    const props = setup();
    const removeButtons = screen.getAllByRole("button", {
      name: /supprimer l'option/i,
    });
    fireEvent.click(removeButtons[1]);
    expect(props.onRemove).toHaveBeenCalledWith("o2");
  });

  it("empêche de supprimer la dernière option restante", () => {
    setup({ options: [{ localId: "o1", label: "Seule" }] });
    expect(
      screen.getByRole("button", { name: /supprimer l'option/i }),
    ).toBeDisabled();
  });
});
