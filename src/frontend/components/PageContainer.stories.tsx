import type { Meta, StoryObj } from "@storybook/nextjs";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { PageContainer } from "./PageContainer";

const meta = {
  title: "Base/PageContainer",
  component: PageContainer,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PageContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {
  args: {
    children: (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Contenu de page
        </Typography>
        <Typography color="text.secondary">
          Le conteneur applique une largeur maximale et des marges verticales
          cohérentes.
        </Typography>
      </Paper>
    ),
  },
};

export const Large: Story = {
  args: { ...Defaut.args, maxWidth: "lg" },
};
