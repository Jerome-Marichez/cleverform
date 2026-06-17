import type { Meta, StoryObj } from "@storybook/nextjs";
import { ErrorState } from "./ErrorState";

const meta = {
  title: "États/ErrorState",
  component: ErrorState,
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
  args: { message: "Impossible de charger les questionnaires." },
};

export const AvecReprise: Story = {
  args: {
    message: "La connexion au serveur a échoué.",
    onRetry: () => {},
  },
};
