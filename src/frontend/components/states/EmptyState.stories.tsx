import type { Meta, StoryObj } from "@storybook/nextjs";
import Button from "@mui/material/Button";
import { EmptyState } from "./EmptyState";

const meta = {
  title: "États/EmptyState",
  component: EmptyState,
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {
  args: {
    title: "Aucune réponse pour le moment",
    description:
      "Partagez votre questionnaire pour commencer à collecter des réponses.",
  },
};

export const AvecAction: Story = {
  args: {
    ...Defaut.args,
    title: "Aucun questionnaire",
    description: "Créez votre premier questionnaire pour démarrer.",
    action: <Button variant="contained">Créer un questionnaire</Button>,
  },
};
