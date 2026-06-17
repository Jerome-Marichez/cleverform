import type { Meta, StoryObj } from "@storybook/nextjs";
import { ColorModeToggle } from "./ColorModeToggle";

// Bouton de bascule du thème (clair / sombre / système).
// Utiliser aussi la barre d'outils « Thème » de Storybook pour voir le rendu
// du bouton lui-même dans les deux modes.
const meta = {
  title: "Base/ColorModeToggle",
  component: ColorModeToggle,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ColorModeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};
