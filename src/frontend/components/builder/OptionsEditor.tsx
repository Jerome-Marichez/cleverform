"use client";

import * as React from "react";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/AddOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import type { BuilderOption } from "@/frontend/hooks/useFormBuilder";

export interface OptionsEditorProps {
  options: BuilderOption[];
  onAdd: () => void;
  onRemove: (optionLocalId: string) => void;
  onChangeLabel: (optionLocalId: string, label: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
}

// Ligne d'option : poignée de glisser-déposer, champ libellé, suppression.
function SortableOptionRow({
  option,
  index,
  canRemove,
  onRemove,
  onChangeLabel,
  disabled,
}: {
  option: BuilderOption;
  index: number;
  canRemove: boolean;
  onRemove: (optionLocalId: string) => void;
  onChangeLabel: (optionLocalId: string, label: string) => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: option.localId, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <Stack
      ref={setNodeRef}
      style={style}
      direction="row"
      spacing={1}
      sx={{ alignItems: "center" }}
    >
      <Box
        {...attributes}
        {...listeners}
        aria-label="Déplacer l'option"
        sx={{
          color: "text.disabled",
          cursor: disabled ? "default" : "grab",
          display: "flex",
          touchAction: "none",
        }}
      >
        <DragIndicatorIcon fontSize="small" />
      </Box>
      <TextField
        size="small"
        fullWidth
        placeholder={`Option ${index + 1}`}
        value={option.label}
        onChange={(event) => onChangeLabel(option.localId, event.target.value)}
        disabled={disabled}
      />
      <IconButton
        aria-label="Supprimer l'option"
        size="small"
        onClick={() => onRemove(option.localId)}
        disabled={disabled || !canRemove}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}

// Éditeur d'options d'une question à choix : liste réordonnable (drag&drop),
// ajout et suppression. N'est rendu QUE pour les types à choix (décision prise
// par le parent). Theme-aware.
export function OptionsEditor({
  options,
  onAdd,
  onRemove,
  onChangeLabel,
  onReorder,
  disabled,
}: OptionsEditorProps) {
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
    const from = options.findIndex((option) => option.localId === active.id);
    const to = options.findIndex((option) => option.localId === over.id);
    if (from !== -1 && to !== -1) {
      onReorder(from, to);
    }
  };

  return (
    <Stack spacing={1.5} sx={{ pl: { sm: 4 } }}>
      <Typography variant="subtitle2" color="text.secondary">
        Options
      </Typography>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={options.map((option) => option.localId)}
          strategy={verticalListSortingStrategy}
        >
          <Stack spacing={1}>
            {options.map((option, index) => (
              <SortableOptionRow
                key={option.localId}
                option={option}
                index={index}
                canRemove={options.length > 1}
                onRemove={onRemove}
                onChangeLabel={onChangeLabel}
                disabled={disabled}
              />
            ))}
          </Stack>
        </SortableContext>
      </DndContext>
      <Box>
        <Button
          startIcon={<AddIcon />}
          size="small"
          onClick={onAdd}
          disabled={disabled}
        >
          Ajouter une option
        </Button>
      </Box>
    </Stack>
  );
}
