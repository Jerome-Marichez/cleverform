import type { Meta, StoryObj } from "@storybook/nextjs";
import Button from "@mui/material/Button";
import { AppHeader } from "./AppHeader";

const meta = {
  title: "Base/AppHeader",
  component: AppHeader,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AppHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};

export const AvecActions: Story = {
  args: {
    actions: (
      <Button variant="contained" size="small">
        Nouveau questionnaire
      </Button>
    ),
  },
};
