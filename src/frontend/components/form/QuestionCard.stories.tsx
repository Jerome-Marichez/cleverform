import type { Meta, StoryObj } from "@storybook/nextjs";
import { QuestionCard } from "./QuestionCard";

const meta = {
  title: "Questionnaire/QuestionCard",
  component: QuestionCard,
  parameters: { layout: "padded" },
  args: { label: "Quel est votre nom ?", type: "SHORT_TEXT", index: 1 },
} satisfies Meta<typeof QuestionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TexteCourt: Story = {};

export const Obligatoire: Story = {
  args: { label: "Votre adresse e-mail ?", type: "EMAIL", required: true, index: 2 },
};

export const ChoixMultiple: Story = {
  args: { label: "Quels thèmes vous intéressent ?", type: "MULTIPLE_CHOICE", index: 3 },
};

export const Note: Story = {
  args: { label: "Notez l'événement de ce soir", type: "RATING", required: true, index: 4 },
};
