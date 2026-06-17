import type { Meta, StoryObj } from "@storybook/nextjs";
import Stack from "@mui/material/Stack";
import { FormStatusChip } from "./FormStatusChip";

const meta = {
  title: "Questionnaire/FormStatusChip",
  component: FormStatusChip,
  parameters: { layout: "centered" },
  args: { status: "DRAFT" },
} satisfies Meta<typeof FormStatusChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Brouillon: Story = { args: { status: "DRAFT" } };
export const Publie: Story = { args: { status: "PUBLISHED" } };
export const Cloture: Story = { args: { status: "CLOSED" } };

export const Tous: Story = {
  render: () => (
    <Stack direction="row" spacing={1}>
      <FormStatusChip status="DRAFT" />
      <FormStatusChip status="PUBLISHED" />
      <FormStatusChip status="CLOSED" />
    </Stack>
  ),
};
