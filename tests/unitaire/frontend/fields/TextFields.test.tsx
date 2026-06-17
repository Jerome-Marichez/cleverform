import * as React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { ShortTextField } from "@/frontend/components/fields/ShortTextField";
import { LongTextField } from "@/frontend/components/fields/LongTextField";
import { NumberField } from "@/frontend/components/fields/NumberField";
import { EmailField } from "@/frontend/components/fields/EmailField";
import { DateField } from "@/frontend/components/fields/DateField";

// Tests unitaires des champs texte (champs contrôlés bâtis sur MUI TextField) :
// ShortText, LongText, Number, Email, Date. Ils partagent le même contrat
// (valeur affichée, onChange, disabled, error) que l'on vérifie ici.

describe("ShortTextField (unitaire)", () => {
  it("affiche la valeur fournie", () => {
    renderWithTheme(<ShortTextField id="q1" value="Bonjour" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("Bonjour");
  });

  it("appelle onChange avec la nouvelle saisie", () => {
    const onChange = jest.fn();
    renderWithTheme(<ShortTextField id="q1" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Marie" } });
    expect(onChange).toHaveBeenCalledWith("Marie");
  });

  it("désactive le champ quand disabled", () => {
    renderWithTheme(<ShortTextField value="" onChange={() => {}} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("affiche le placeholder", () => {
    renderWithTheme(
      <ShortTextField value="" onChange={() => {}} placeholder="Votre nom" />,
    );
    expect(screen.getByPlaceholderText("Votre nom")).toBeInTheDocument();
  });

  it("marque le champ requis", () => {
    renderWithTheme(<ShortTextField value="" onChange={() => {}} required />);
    expect(screen.getByRole("textbox")).toBeRequired();
  });

  it("marque le champ en erreur (aria-invalid)", () => {
    renderWithTheme(<ShortTextField value="" onChange={() => {}} error />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("LongTextField (unitaire)", () => {
  it("affiche la valeur dans une zone multiligne", () => {
    renderWithTheme(<LongTextField value="ligne 1" onChange={() => {}} />);
    const textbox = screen.getByRole("textbox");
    expect(textbox).toHaveValue("ligne 1");
    expect(textbox.tagName).toBe("TEXTAREA");
  });

  it("appelle onChange avec la saisie", () => {
    const onChange = jest.fn();
    renderWithTheme(<LongTextField value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "abc" } });
    expect(onChange).toHaveBeenCalledWith("abc");
  });

  it("désactive le champ quand disabled", () => {
    renderWithTheme(<LongTextField value="" onChange={() => {}} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});

describe("NumberField (unitaire)", () => {
  it("rend un champ de type number affichant la valeur", () => {
    renderWithTheme(<NumberField value="42" onChange={() => {}} />);
    const input = screen.getByRole("spinbutton");
    expect(input).toHaveValue(42);
    expect(input).toHaveAttribute("type", "number");
  });

  it("appelle onChange avec la chaîne saisie", () => {
    const onChange = jest.fn();
    renderWithTheme(<NumberField value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "7" } });
    expect(onChange).toHaveBeenCalledWith("7");
  });

  it("désactive le champ quand disabled", () => {
    renderWithTheme(<NumberField value="" onChange={() => {}} disabled />);
    expect(screen.getByRole("spinbutton")).toBeDisabled();
  });
});

describe("EmailField (unitaire)", () => {
  it("rend un champ de type email avec un placeholder d'exemple", () => {
    renderWithTheme(<EmailField value="" onChange={() => {}} />);
    const input = screen.getByPlaceholderText("nom@exemple.fr");
    expect(input).toHaveAttribute("type", "email");
  });

  it("affiche la valeur fournie", () => {
    renderWithTheme(<EmailField value="a@b.fr" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("a@b.fr");
  });

  it("appelle onChange avec la saisie", () => {
    const onChange = jest.fn();
    renderWithTheme(<EmailField value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "x@y.fr" },
    });
    expect(onChange).toHaveBeenCalledWith("x@y.fr");
  });

  it("marque le champ en erreur (aria-invalid)", () => {
    renderWithTheme(<EmailField value="" onChange={() => {}} error />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("DateField (unitaire)", () => {
  it("rend un champ de type date affichant la valeur ISO", () => {
    const { container } = renderWithTheme(
      <DateField value="2026-06-17" onChange={() => {}} />,
    );
    const input = container.querySelector('input[type="date"]');
    expect(input).not.toBeNull();
    expect(input).toHaveValue("2026-06-17");
  });

  it("appelle onChange avec la nouvelle date", () => {
    const onChange = jest.fn();
    const { container } = renderWithTheme(
      <DateField value="" onChange={onChange} />,
    );
    const input = container.querySelector('input[type="date"]')!;
    fireEvent.change(input, { target: { value: "2026-01-01" } });
    expect(onChange).toHaveBeenCalledWith("2026-01-01");
  });

  it("désactive le champ quand disabled", () => {
    const { container } = renderWithTheme(
      <DateField value="" onChange={() => {}} disabled />,
    );
    expect(container.querySelector('input[type="date"]')).toBeDisabled();
  });
});
