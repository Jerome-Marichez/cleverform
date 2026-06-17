import * as React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import Button from "@mui/material/Button";
import { StatusSnackbar } from "./StatusSnackbar";

const meta = {
  title: "États/StatusSnackbar",
  component: StatusSnackbar,
  parameters: { layout: "centered" },
  args: { onClose: () => {} },
  render: (args) => {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Afficher le toast
        </Button>
        <StatusSnackbar {...args} open={open} onClose={() => setOpen(false)} />
      </>
    );
  },
} satisfies Meta<typeof StatusSnackbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Succes: Story = {
  args: { open: false, message: "Questionnaire créé avec succès", severity: "success" },
};

export const Erreur: Story = {
  args: { open: false, message: "Échec de l'enregistrement", severity: "error" },
};
