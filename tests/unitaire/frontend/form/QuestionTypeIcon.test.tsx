import * as React from "react";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { QuestionTypeIcon } from "@/frontend/components/form/QuestionTypeIcon";

// Tests unitaires de QuestionTypeIcon : l'icône expose le libellé du type
// comme nom accessible (aria-label) et infobulle.

describe("QuestionTypeIcon (unitaire)", () => {
  it("expose le libellé du type comme nom accessible (EMAIL → E-mail)", () => {
    renderWithTheme(<QuestionTypeIcon type="EMAIL" />);
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
  });

  it("reflète un autre type (RATING → Note)", () => {
    renderWithTheme(<QuestionTypeIcon type="RATING" />);
    expect(screen.getByLabelText("Note")).toBeInTheDocument();
  });
});
