import type { Meta, StoryObj } from "@storybook/nextjs";
import { Logo } from "./Logo";

const meta = {
  title: "Base/Logo",
  component: Logo,
  parameters: { layout: "centered" },
  args: { variant: "full", size: 32 },
  argTypes: {
    variant: { control: "inline-radio", options: ["full", "mark"] },
    size: { control: { type: "range", min: 16, max: 96, step: 4 } },
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complet: Story = {};
export const Pictogramme: Story = { args: { variant: "mark", size: 48 } };
export const Grand: Story = { args: { size: 64 } };
