import * as React from "react";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import {
  FormStatusChip,
  type FormStatus,
} from "@/frontend/components/form/FormStatusChip";

// Tests unitaires de FormStatusChip : libellé français selon le statut.

describe("FormStatusChip (unitaire)", () => {
  const cases: Array<[FormStatus, string]> = [
    ["DRAFT", "Brouillon"],
    ["PUBLISHED", "Publié"],
    ["CLOSED", "Clôturé"],
  ];

  it.each(cases)("affiche le libellé %s → %s", (status, label) => {
    renderWithTheme(<FormStatusChip status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
