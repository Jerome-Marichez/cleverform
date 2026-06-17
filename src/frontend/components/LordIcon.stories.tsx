import type { Meta, StoryObj } from "@storybook/nextjs";
import { LordIcon } from "./LordIcon";
import createIcon from "../../../public/icons/create.json";
import shareIcon from "../../../public/icons/share.json";
import analyzeIcon from "../../../public/icons/analyze.json";

const meta = {
  title: "Base/LordIcon",
  component: LordIcon,
  parameters: { layout: "centered" },
  args: { icon: createIcon, size: 72, trigger: "loop" },
  argTypes: {
    trigger: { control: "inline-radio", options: ["hover", "loop", "once"] },
    size: { control: { type: "range", min: 24, max: 160, step: 8 } },
    icon: { control: false },
  },
} satisfies Meta<typeof LordIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

// Survolez l'icône pour rejouer l'animation.
export const Survol: Story = { args: { trigger: "hover", label: "Créer" } };
export const Boucle: Story = { args: { trigger: "loop", label: "Créer" } };
export const Partage: Story = {
  args: { icon: shareIcon, trigger: "loop", label: "Diffuser" },
};
export const Analyse: Story = {
  args: { icon: analyzeIcon, trigger: "loop", label: "Visualiser" },
};
