import * as React from "react";
import type { Preview } from "@storybook/nextjs";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import { ThemeProvider, useColorScheme } from "@mui/material/styles";
import { theme } from "../src/frontend/theme";

// Décorateur global : enveloppe chaque story dans le thème MUI de l'application
// (clair / sombre) et synchronise le mode avec la barre d'outils « Thème ».
// Ainsi, chaque composant est visualisable dans les **deux modes**.

function ColorSchemeSync({ mode }: { mode: "light" | "dark" }) {
  const { setMode } = useColorScheme();
  React.useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);
  return null;
}

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  globalTypes: {
    theme: {
      description: "Bascule clair / sombre",
      toolbar: {
        title: "Thème",
        icon: "paintbrush",
        items: [
          { value: "light", title: "Clair", icon: "sun" },
          { value: "dark", title: "Sombre", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [
    (Story, context) => {
      const mode = context.globals.theme === "dark" ? "dark" : "light";
      return (
        <ThemeProvider theme={theme} defaultMode={mode}>
          <CssBaseline />
          <ColorSchemeSync mode={mode} />
          <Box
            sx={{
              p: 3,
              minHeight: "100vh",
              bgcolor: "background.default",
              color: "text.primary",
            }}
          >
            <Story />
          </Box>
        </ThemeProvider>
      );
    },
  ],
};

export default preview;
