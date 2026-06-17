import * as React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { QuestionField, type AnswerValue } from "./QuestionField";

// Le dispatcher couvre chaque type de question (un champ par type) + les états
// « obligatoire » et « erreur ». État géré localement pour une démo interactive.
const meta = {
  title: "Réponse/QuestionField",
  component: QuestionField,
  parameters: { layout: "padded" },
  args: { id: "q", label: "Question", type: "SHORT_TEXT", value: "", onChange: () => {} },
  render: (args) => {
    const initial: AnswerValue =
      args.type === "MULTIPLE_CHOICE" ? [] : args.type === "RATING" ? null : "";
    const [value, setValue] = React.useState<AnswerValue>(initial);
    return <QuestionField {...args} value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof QuestionField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TexteCourt: Story = { args: { label: "Quel est votre nom ?", type: "SHORT_TEXT" } };
export const TexteLong: Story = { args: { label: "Un commentaire à partager ?", type: "LONG_TEXT" } };
export const ChoixUnique: Story = {
  args: { label: "Votre tranche d'âge ?", type: "SINGLE_CHOICE", options: ["18–25", "26–40", "41 et +"] },
};
export const ChoixMultiple: Story = {
  args: { label: "Quels thèmes vous intéressent ?", type: "MULTIPLE_CHOICE", options: ["IA", "Web", "Cloud", "Data"] },
};
export const Note: Story = { args: { label: "Notez la soirée", type: "RATING" } };
export const Nombre: Story = { args: { label: "Combien de participants ?", type: "NUMBER" } };
export const Email: Story = { args: { label: "Votre adresse e-mail", type: "EMAIL" } };
export const SaisieDate: Story = { args: { label: "Date de l'événement", type: "DATE" } };

export const Obligatoire: Story = {
  args: { label: "Votre nom (obligatoire)", type: "SHORT_TEXT", required: true },
};
export const Erreur: Story = {
  args: { label: "Votre adresse e-mail", type: "EMAIL", error: "Adresse e-mail invalide." },
};
