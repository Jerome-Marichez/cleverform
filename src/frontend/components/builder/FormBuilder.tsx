"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import SaveIcon from "@mui/icons-material/SaveOutlined";
import PublishIcon from "@mui/icons-material/PublishOutlined";
import type { AlertColor } from "@mui/material/Alert";
import type { FormStatus } from "@/shared/schemas/form";
import { PageContainer } from "@/frontend/components/PageContainer";
import { FormStatusChip } from "@/frontend/components/form/FormStatusChip";
import { EmptyState } from "@/frontend/components/states/EmptyState";
import { StatusSnackbar } from "@/frontend/components/states/StatusSnackbar";
import {
  useFormBuilder,
  type FormBuilderInitialData,
} from "@/frontend/hooks/useFormBuilder";
import { QuestionTypePalette } from "./QuestionTypePalette";
import { QuestionEditorItem } from "./QuestionEditorItem";

export interface FormBuilderProps {
  /** Clé interne du questionnaire (jamais exposée publiquement). */
  formId: string;
  status: FormStatus;
  initialData: FormBuilderInitialData;
}

interface Toast {
  message: string;
  severity: AlertColor;
}

// Form Builder : éditeur complet d'un questionnaire (titre, description, palette
// de types, liste de questions réordonnables en glisser-déposer, options par
// question à choix). Enregistre via PATCH `/api/admin/forms/[id]` et publie via
// la route de publication. Gère les états de chargement / erreur (StatusSnackbar).
export function FormBuilder({ formId, status, initialData }: FormBuilderProps) {
  const router = useRouter();
  const builder = useFormBuilder(initialData);
  const [currentStatus, setCurrentStatus] = React.useState<FormStatus>(status);
  const [saving, setSaving] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [toast, setToast] = React.useState<Toast | null>(null);

  const busy = saving || publishing;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const from = builder.questions.findIndex((q) => q.localId === active.id);
    const to = builder.questions.findIndex((q) => q.localId === over.id);
    if (from !== -1 && to !== -1) {
      builder.reorderQuestions(from, to);
    }
  };

  // Persiste le brouillon (PATCH). Renvoie true en cas de succès.
  async function persist(): Promise<boolean> {
    const validationError = builder.validate();
    if (validationError) {
      setToast({ message: validationError.message, severity: "error" });
      return false;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/forms/${formId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(builder.buildPayload()),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setToast({
          message: data?.error ?? "Enregistrement impossible. Réessayez.",
          severity: "error",
        });
        return false;
      }

      setToast({ message: "Questionnaire enregistré.", severity: "success" });
      router.refresh();
      return true;
    } catch {
      setToast({
        message: "Une erreur réseau est survenue. Réessayez.",
        severity: "error",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }

  // Enregistre puis publie (DRAFT → PUBLISHED).
  async function publish() {
    const saved = await persist();
    if (!saved) {
      return;
    }

    setPublishing(true);
    try {
      const response = await fetch(`/api/admin/forms/${formId}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setToast({
          message: data?.error ?? "Publication impossible. Réessayez.",
          severity: "error",
        });
        return;
      }

      setCurrentStatus("PUBLISHED");
      setToast({ message: "Questionnaire publié.", severity: "success" });
      router.refresh();
    } catch {
      setToast({
        message: "Une erreur réseau est survenue. Réessayez.",
        severity: "error",
      });
    } finally {
      setPublishing(false);
    }
  }

  const canPublish = currentStatus === "DRAFT";

  return (
    <PageContainer>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              Éditeur de questionnaire
            </Typography>
            <FormStatusChip status={currentStatus} />
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={persist}
              loading={saving}
              disabled={busy}
            >
              Enregistrer
            </Button>
            <Button
              variant="contained"
              startIcon={<PublishIcon />}
              onClick={publish}
              loading={publishing}
              disabled={busy || !canPublish}
            >
              Publier
            </Button>
          </Stack>
        </Stack>

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2}>
            <TextField
              label="Titre du questionnaire"
              fullWidth
              value={builder.title}
              onChange={(event) => builder.setTitle(event.target.value)}
              disabled={busy}
            />
            <TextField
              label="Description (facultative)"
              fullWidth
              multiline
              minRows={2}
              value={builder.description}
              onChange={(event) => builder.setDescription(event.target.value)}
              disabled={busy}
            />
          </Stack>
        </Paper>

        <QuestionTypePalette onAddQuestion={builder.addQuestion} disabled={busy} />

        <Divider />

        {builder.questions.length === 0 ? (
          <EmptyState
            title="Aucune question"
            description="Utilisez la palette ci-dessus pour ajouter votre première question."
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={builder.questions.map((q) => q.localId)}
              strategy={verticalListSortingStrategy}
            >
              <Stack spacing={2}>
                {builder.questions.map((question, index) => (
                  <QuestionEditorItem
                    key={question.localId}
                    question={question}
                    index={index + 1}
                    onChangeLabel={(label) =>
                      builder.updateQuestionLabel(question.localId, label)
                    }
                    onToggleRequired={(required) =>
                      builder.toggleQuestionRequired(question.localId, required)
                    }
                    onRemove={() => builder.removeQuestion(question.localId)}
                    onAddOption={() => builder.addOption(question.localId)}
                    onRemoveOption={(optionLocalId) =>
                      builder.removeOption(question.localId, optionLocalId)
                    }
                    onChangeOptionLabel={(optionLocalId, label) =>
                      builder.updateOptionLabel(
                        question.localId,
                        optionLocalId,
                        label,
                      )
                    }
                    onReorderOptions={(from, to) =>
                      builder.reorderOptions(question.localId, from, to)
                    }
                    disabled={busy}
                  />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>
        )}

        <Box sx={{ height: 8 }} />
      </Stack>

      <StatusSnackbar
        open={toast !== null}
        message={toast?.message ?? ""}
        severity={toast?.severity}
        onClose={() => setToast(null)}
      />
    </PageContainer>
  );
}
