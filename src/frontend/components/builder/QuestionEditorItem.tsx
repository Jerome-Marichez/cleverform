"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import SpellcheckIcon from "@mui/icons-material/Spellcheck";
import { isChoiceQuestionType } from "@/shared/schemas/formInput";
import { questionTypeMeta } from "@/frontend/components/form/questionTypeMeta";
import type { BuilderQuestion } from "@/frontend/hooks/useFormBuilder";
import { OptionsEditor } from "./OptionsEditor";

export interface QuestionEditorItemProps {
  question: BuilderQuestion;
  /** Position affichée (1-based). */
  index: number;
  onChangeLabel: (label: string) => void;
  onToggleRequired: (required: boolean) => void;
  onRemove: () => void;
  onAddOption: () => void;
  onRemoveOption: (optionLocalId: string) => void;
  onChangeOptionLabel: (optionLocalId: string, label: string) => void;
  onReorderOptions: (fromIndex: number, toIndex: number) => void;
  /** Corrige l'orthographe/grammaire du libellé via IA (facultatif). */
  onProofreadLabel?: () => void;
  /** Vrai pendant la correction IA du libellé de cette question. */
  proofreading?: boolean;
  disabled?: boolean;
}

// Carte d'édition d'une question dans le Builder : poignée de glisser-déposer
// (réordre vertical via @dnd-kit/sortable), libellé (avec action « Corriger
// l'orthographe » par IA), type (icône + nom), switch « obligatoire »,
// suppression, et éditeur d'options pour les types à choix.
export function QuestionEditorItem({
  question,
  index,
  onChangeLabel,
  onToggleRequired,
  onRemove,
  onAddOption,
  onRemoveOption,
  onChangeOptionLabel,
  onReorderOptions,
  onProofreadLabel,
  proofreading,
  disabled,
}: QuestionEditorItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.localId, disabled });

  const meta = questionTypeMeta[question.type];
  const Icon = meta.Icon;
  const showOptions = isChoiceQuestionType(question.type);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  // L'action de correction n'est proposée que si un handler est fourni et que le
  // libellé n'est pas vide.
  const canProofread =
    onProofreadLabel !== undefined &&
    !disabled &&
    question.label.trim().length > 0;

  return (
    <Card ref={setNodeRef} style={style}>
      <CardContent>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <Box
            {...attributes}
            {...listeners}
            aria-label="Déplacer la question"
            sx={{
              color: "text.disabled",
              cursor: disabled ? "default" : "grab",
              display: "flex",
              pt: 1,
              touchAction: "none",
            }}
          >
            <DragIndicatorIcon />
          </Box>

          <Stack spacing={2} sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", color: "text.secondary" }}
            >
              <Typography variant="body2" color="text.secondary">
                {index}.
              </Typography>
              <Icon fontSize="small" />
              <Typography variant="body2">{meta.label}</Typography>
            </Stack>

            <TextField
              label="Libellé de la question"
              fullWidth
              value={question.label}
              onChange={(event) => onChangeLabel(event.target.value)}
              disabled={disabled || proofreading}
              slotProps={{
                input: onProofreadLabel
                  ? {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Corriger l'orthographe (IA)">
                            <span>
                              <IconButton
                                aria-label="Corriger l'orthographe du libellé"
                                edge="end"
                                size="small"
                                onClick={onProofreadLabel}
                                disabled={!canProofread || proofreading}
                              >
                                {proofreading ? (
                                  <CircularProgress size={18} />
                                ) : (
                                  <SpellcheckIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }
                  : undefined,
              }}
            />

            {showOptions ? (
              <OptionsEditor
                options={question.options}
                onAdd={onAddOption}
                onRemove={onRemoveOption}
                onChangeLabel={onChangeOptionLabel}
                onReorder={onReorderOptions}
                disabled={disabled}
              />
            ) : null}

            <FormControlLabel
              control={
                <Switch
                  checked={question.required}
                  onChange={(event) => onToggleRequired(event.target.checked)}
                  disabled={disabled}
                />
              }
              label="Réponse obligatoire"
            />
          </Stack>

          <IconButton
            aria-label="Supprimer la question"
            onClick={onRemove}
            disabled={disabled}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
}
