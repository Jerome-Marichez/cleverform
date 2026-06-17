"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import { useFormMutations } from "@/frontend/hooks/useFormMutations";

export interface CreateFormDialogProps {
  open: boolean;
  onClose: () => void;
}

// Formulaire interne de la boîte de dialogue. Isolé pour être **remonté à chaque
// ouverture** (via la `key` posée par `CreateFormDialog`) : on repart ainsi d'un
// état propre sans `useEffect` de réinitialisation.
function CreateFormBody({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { createForm, pending, error } = useFormMutations();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [titleTouched, setTitleTouched] = React.useState(false);

  const trimmedTitle = title.trim();
  const titleError = titleTouched && trimmedTitle.length === 0;

  const handleClose = () => {
    if (pending) return;
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTitleTouched(true);
    if (trimmedTitle.length === 0) return;

    try {
      const form = await createForm({
        title: trimmedTitle,
        description: description.trim() || undefined,
      });
      router.push(`/admin/forms/${form.id}/edit`);
    } catch {
      // L'erreur est déjà exposée par `useFormMutations` (état `error`).
    }
  };

  return (
    <Stack component="form" onSubmit={handleSubmit} noValidate>
      <DialogTitle>Nouveau questionnaire</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {error ? (
            <Alert severity="error" role="alert">
              {error}
            </Alert>
          ) : null}

          <TextField
            label="Titre"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => setTitleTouched(true)}
            error={titleError}
            helperText={
              titleError ? "Le titre du questionnaire est requis." : " "
            }
            autoFocus
            fullWidth
            required
            disabled={pending}
          />

          <TextField
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            multiline
            minRows={2}
            fullWidth
            disabled={pending}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={pending}>
          Annuler
        </Button>
        <Button
          type="submit"
          variant="contained"
          loading={pending}
          disabled={trimmedTitle.length === 0}
        >
          Créer
        </Button>
      </DialogActions>
    </Stack>
  );
}

// Boîte de dialogue de création d'un questionnaire (titre + description).
// À la validation, POST `/api/admin/forms` puis redirection vers l'éditeur du
// questionnaire créé. Gère le titre requis, l'état de chargement et l'erreur
// serveur. Theme-aware via le thème MUI de l'application.
//
// Le contenu n'est monté que lorsque la boîte est ouverte, et il est remonté à
// chaque ouverture (`key={open}`) pour repartir d'un formulaire vierge.
export function CreateFormDialog({ open, onClose }: CreateFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {open ? <CreateFormBody key={String(open)} onClose={onClose} /> : null}
    </Dialog>
  );
}
