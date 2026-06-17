import { createTheme } from "@mui/material/styles";

// Thème MUI centralisé. Voir docs/design.md.
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1f6f54" },
    secondary: { main: "#9bd633" },
  },
  shape: { borderRadius: 10 },
});
