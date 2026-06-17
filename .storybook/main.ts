import type { StorybookConfig } from "@storybook/nextjs";

// Configuration Storybook — surface de **rendu / visualisation** des composants
// (pas un outil de test ici ; les tests sont gérés par Jest, voir docs/testing.md).
// Les stories sont co-localisées avec les composants sous src/frontend/.
const config: StorybookConfig = {
  framework: { name: "@storybook/nextjs", options: {} },
  stories: ["../src/frontend/**/*.stories.@(ts|tsx)"],
  addons: [],
  staticDirs: ["../public"],
};

export default config;
