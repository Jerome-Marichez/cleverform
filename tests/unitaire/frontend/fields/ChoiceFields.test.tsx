import * as React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { SingleChoiceField } from "@/frontend/components/fields/SingleChoiceField";
import { MultipleChoiceField } from "@/frontend/components/fields/MultipleChoiceField";
import { RatingField } from "@/frontend/components/fields/RatingField";

// Tests unitaires des champs à choix (radio / cases) et de la note (étoiles).

const OPTIONS = ["Rouge", "Vert", "Bleu"];

describe("SingleChoiceField (unitaire)", () => {
  it("affiche toutes les options en boutons radio", () => {
    renderWithTheme(
      <SingleChoiceField value="" onChange={() => {}} options={OPTIONS} />,
    );
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    OPTIONS.forEach((label) =>
      expect(screen.getByLabelText(label)).toBeInTheDocument(),
    );
  });

  it("coche l'option correspondant à la valeur", () => {
    renderWithTheme(
      <SingleChoiceField value="Vert" onChange={() => {}} options={OPTIONS} />,
    );
    expect(screen.getByRole("radio", { name: "Vert" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Rouge" })).not.toBeChecked();
  });

  it("appelle onChange avec l'option sélectionnée", () => {
    const onChange = jest.fn();
    renderWithTheme(
      <SingleChoiceField value="" onChange={onChange} options={OPTIONS} />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Bleu" }));
    expect(onChange).toHaveBeenCalledWith("Bleu");
  });

  it("désactive toutes les options quand disabled", () => {
    renderWithTheme(
      <SingleChoiceField value="" onChange={() => {}} options={OPTIONS} disabled />,
    );
    screen.getAllByRole("radio").forEach((radio) => expect(radio).toBeDisabled());
  });
});

describe("MultipleChoiceField (unitaire)", () => {
  it("affiche toutes les options en cases à cocher", () => {
    renderWithTheme(
      <MultipleChoiceField value={[]} onChange={() => {}} options={OPTIONS} />,
    );
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });

  it("coche les options présentes dans la valeur", () => {
    renderWithTheme(
      <MultipleChoiceField
        value={["Rouge", "Bleu"]}
        onChange={() => {}}
        options={OPTIONS}
      />,
    );
    expect(screen.getByRole("checkbox", { name: "Rouge" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Vert" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Bleu" })).toBeChecked();
  });

  it("ajoute une option à la sélection lors d'un clic", () => {
    const onChange = jest.fn();
    renderWithTheme(
      <MultipleChoiceField
        value={["Rouge"]}
        onChange={onChange}
        options={OPTIONS}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Vert" }));
    expect(onChange).toHaveBeenCalledWith(["Rouge", "Vert"]);
  });

  it("retire une option déjà sélectionnée lors d'un clic", () => {
    const onChange = jest.fn();
    renderWithTheme(
      <MultipleChoiceField
        value={["Rouge", "Vert"]}
        onChange={onChange}
        options={OPTIONS}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Rouge" }));
    expect(onChange).toHaveBeenCalledWith(["Vert"]);
  });

  it("désactive toutes les cases quand disabled", () => {
    renderWithTheme(
      <MultipleChoiceField
        value={[]}
        onChange={() => {}}
        options={OPTIONS}
        disabled
      />,
    );
    screen
      .getAllByRole("checkbox")
      .forEach((checkbox) => expect(checkbox).toBeDisabled());
  });
});

describe("RatingField (unitaire)", () => {
  it("affiche le nombre d'étoiles par défaut (5)", () => {
    renderWithTheme(<RatingField value={null} onChange={() => {}} />);
    // MUI Rating expose un bouton radio nommé « N Star(s) » par valeur possible
    // (plus un radio « vide » technique non nommé). On compte donc les étoiles
    // par leur nom accessible.
    expect(screen.getByRole("radio", { name: "1 Star" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "5 Stars" })).toBeInTheDocument();
    expect(
      screen.queryByRole("radio", { name: "6 Stars" }),
    ).not.toBeInTheDocument();
  });

  it("respecte le maximum personnalisé", () => {
    renderWithTheme(<RatingField value={null} onChange={() => {}} max={3} />);
    expect(screen.getByRole("radio", { name: "3 Stars" })).toBeInTheDocument();
    expect(
      screen.queryByRole("radio", { name: "4 Stars" }),
    ).not.toBeInTheDocument();
  });

  it("reflète la note courante", () => {
    renderWithTheme(<RatingField value={4} onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "4 Stars" })).toBeChecked();
  });

  it("appelle onChange avec la note cliquée", () => {
    const onChange = jest.fn();
    renderWithTheme(<RatingField value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "3 Stars" }));
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
