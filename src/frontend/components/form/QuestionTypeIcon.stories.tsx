import type { Meta, StoryObj } from "@storybook/nextjs";
import Stack from "@mui/material/Stack";
import type { QuestionType } from "@/shared/schemas/form";
import { QuestionTypeIcon } from "./QuestionTypeIcon";
import { questionTypeMeta } from "./questionTypeMeta";

const meta = {
  title: "Questionnaire/QuestionTypeIcon",
  component: QuestionTypeIcon,
  parameters: { layout: "centered" },
  args: { type: "SHORT_TEXT" },
} satisfies Meta<typeof QuestionTypeIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};

export const TousLesTypes: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      {(Object.keys(questionTypeMeta) as QuestionType[]).map((t) => (
        <QuestionTypeIcon key={t} type={t} fontSize="medium" />
      ))}
    </Stack>
  ),
};
