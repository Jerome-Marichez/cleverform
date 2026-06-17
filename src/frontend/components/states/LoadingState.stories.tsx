import type { Meta, StoryObj } from "@storybook/nextjs";
import { LoadingState } from "./LoadingState";

const meta = {
  title: "États/LoadingState",
  component: LoadingState,
} satisfies Meta<typeof LoadingState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Spinner: Story = {};
export const Squelette: Story = { args: { variant: "skeleton", rows: 4 } };
