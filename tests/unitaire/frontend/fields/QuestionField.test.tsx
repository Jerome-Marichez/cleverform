import * as React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { QuestionField } from "@/frontend/components/fields/QuestionField";

// Tests unitaires du dispatcher QuestionField : selon `type`, il monte le bon
// sous-champ, affiche le libellé (avec marqueur « obligatoire ») et le message
// d'erreur inline.

describe("QuestionField (unitaire) — libellé et états", () => {
  it("affiche le libellé associé au champ", () => {
    renderWithTheme(
      <QuestionField
        id="q1"
        label="Votre nom ?"
        type="SHORT_TEXT"
        value=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("Votre nom ?")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("affiche un marqueur d'obligation quand required", () => {
    renderWithTheme(
      <QuestionField
        label="Email"
        type="EMAIL"
        required
        value=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("n'affiche pas de marqueur quand le champ est facultatif", () => {
    renderWithTheme(
      <QuestionField label="Email" type="EMAIL" value="" onChange={() => {}} />,
    );
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("affiche le message d'erreur inline quand error est fourni", () => {
    renderWithTheme(
      <QuestionField
        label="Email"
        type="EMAIL"
        value=""
        onChange={() => {}}
        error="Adresse invalide"
      />,
    );
    expect(screen.getByText("Adresse invalide")).toBeInTheDocument();
  });
});

describe("QuestionField (unitaire) — dispatch par type", () => {
  it("SHORT_TEXT → champ texte simple", () => {
    renderWithTheme(
      <QuestionField label="x" type="SHORT_TEXT" value="" onChange={() => {}} />,
    );
    const input = screen.getByRole("textbox");
    expect(input.tagName).toBe("INPUT");
  });

  it("LONG_TEXT → zone de texte multiligne", () => {
    renderWithTheme(
      <QuestionField label="x" type="LONG_TEXT" value="" onChange={() => {}} />,
    );
    expect(screen.getByRole("textbox").tagName).toBe("TEXTAREA");
  });

  it("NUMBER → champ numérique", () => {
    renderWithTheme(
      <QuestionField label="x" type="NUMBER" value="" onChange={() => {}} />,
    );
    expect(screen.getByRole("spinbutton")).toHaveAttribute("type", "number");
  });

  it("EMAIL → champ e-mail", () => {
    renderWithTheme(
      <QuestionField label="x" type="EMAIL" value="" onChange={() => {}} />,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
  });

  it("DATE → champ date", () => {
    const { container } = renderWithTheme(
      <QuestionField label="x" type="DATE" value="" onChange={() => {}} />,
    );
    expect(container.querySelector('input[type="date"]')).not.toBeNull();
  });

  it("SINGLE_CHOICE → boutons radio à partir des options", () => {
    renderWithTheme(
      <QuestionField
        label="x"
        type="SINGLE_CHOICE"
        options={["A", "B"]}
        value=""
        onChange={() => {}}
      />,
    );
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("MULTIPLE_CHOICE → cases à cocher à partir des options", () => {
    renderWithTheme(
      <QuestionField
        label="x"
        type="MULTIPLE_CHOICE"
        options={["A", "B", "C"]}
        value={[]}
        onChange={() => {}}
      />,
    );
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });

  it("RATING → étoiles de notation", () => {
    renderWithTheme(
      <QuestionField label="x" type="RATING" value={null} onChange={() => {}} />,
    );
    expect(screen.getByRole("radio", { name: "5 Stars" })).toBeInTheDocument();
  });
});

describe("QuestionField (unitaire) — propagation onChange", () => {
  it("transmet la saisie du champ texte", () => {
    const onChange = jest.fn();
    renderWithTheme(
      <QuestionField
        label="x"
        type="SHORT_TEXT"
        value=""
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "hello" } });
    expect(onChange).toHaveBeenCalledWith("hello");
  });

  it("transmet la sélection multiple sous forme de tableau", () => {
    const onChange = jest.fn();
    renderWithTheme(
      <QuestionField
        label="x"
        type="MULTIPLE_CHOICE"
        options={["A", "B"]}
        value={[]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "A" }));
    expect(onChange).toHaveBeenCalledWith(["A"]);
  });
});
