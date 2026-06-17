import * as React from "react";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@/frontend/theme";
import { LordIcon } from "@/frontend/components/LordIcon";

// Données Lottie minimales mais valides (props réelles, sans mock). Le lecteur
// `@lordicon/react` n'est chargé que côté navigateur (next/dynamic ssr:false) :
// en jsdom, LordIcon rend donc son conteneur dimensionné sans crash.
const minimalIcon = {
  v: "5.8.1",
  fr: 60,
  ip: 0,
  op: 10,
  w: 24,
  h: 24,
  nm: "minimal",
  ddd: 0,
  assets: [],
  layers: [],
  markers: [],
};

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <ThemeProvider theme={theme} defaultMode="light">
      {ui}
    </ThemeProvider>,
  );
}

describe("LordIcon (unitaire)", () => {
  it("se rend sans crash avec un JSON Lottie minimal", () => {
    const { getByTestId } = renderWithTheme(<LordIcon icon={minimalIcon} />);
    expect(getByTestId("lord-icon")).toBeInTheDocument();
  });

  it("est décorative (aria-hidden) en l'absence de libellé", () => {
    const { getByTestId } = renderWithTheme(<LordIcon icon={minimalIcon} />);
    expect(getByTestId("lord-icon")).toHaveAttribute("aria-hidden", "true");
  });

  it("expose un rôle image et un libellé accessible quand `label` est fourni", () => {
    const { getByRole } = renderWithTheme(
      <LordIcon icon={minimalIcon} label="Créer" />,
    );
    expect(getByRole("img", { name: "Créer" })).toBeInTheDocument();
  });
});
