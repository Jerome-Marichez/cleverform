import { createTheme } from "@mui/material/styles";

// Thème MUI centralisé de CleverForm.
//
// - Couleur dominante : le **vert** de la marque (décliné en clair ET en sombre).
// - Mode clair / sombre géré par variables CSS avec un **sélecteur de classe**
//   (`colorSchemeSelector: "class"`) : la bascule peut donc se faire en JS
//   (voir ColorModeToggle) tout en respectant la **préférence système** par défaut
//   (voir Providers + `InitColorSchemeScript` dans le layout).
//
// Voir docs/design.md et docs/storybook.md.
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#1f6f54" }, // vert marque
        secondary: { main: "#9bd633" }, // vert clair (accents)
        background: { default: "#f5f8f6", paper: "#ffffff" },
      },
    },
    dark: {
      palette: {
        primary: { main: "#5bc78f" }, // vert éclairci pour le contraste en sombre
        secondary: { main: "#9bd633" },
        background: { default: "#0e1411", paper: "#161d19" },
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    button: { textTransform: "none", fontWeight: 600 },
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiCard: { defaultProps: { variant: "outlined" } },
  },
});
