import type { Meta, StoryObj } from "@storybook/nextjs";
import { FormCard } from "./FormCard";

const meta = {
  title: "Questionnaire/FormCard",
  component: FormCard,
  parameters: { layout: "padded" },
  args: {
    title: "Satisfaction — événement IA",
    description:
      "Recueil d'avis à chaud auprès des participants de la soirée sur le thème de l'IA.",
    status: "PUBLISHED",
    questionCount: 8,
    updatedAt: "2026-06-10",
  },
} satisfies Meta<typeof FormCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Publie: Story = {};

export const Brouillon: Story = {
  args: {
    title: "Nouveau questionnaire",
    description: null,
    status: "DRAFT",
    questionCount: 1,
  },
};

export const Cloture: Story = {
  args: { status: "CLOSED", questionCount: 12 },
};
