import type { Meta, StoryObj } from "@storybook/nextjs";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { DottedBackground } from "./DottedBackground";

const meta = {
  title: "Base/DottedBackground",
  component: DottedBackground,
  parameters: { layout: "fullscreen" },
  argTypes: {
    gap: { control: { type: "range", min: 8, max: 64, step: 4 } },
    dotSize: { control: { type: "range", min: 0.5, max: 4, step: 0.5 } },
  },
} satisfies Meta<typeof DottedBackground>;

export default meta;
type Story = StoryObj<typeof meta>;

// Fond pointillé avec contenu posé au-dessus.
export const AvecContenu: Story = {
  args: {
    children: (
      <Box sx={{ minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="h4">Contenu sur fond pointillé</Typography>
      </Box>
    ),
  },
};

// Motif plus dense.
export const Dense: Story = {
  args: { ...AvecContenu.args, gap: 14, dotSize: 1 },
};
