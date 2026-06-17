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
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useAiAssist } from "@/frontend/hooks/useAiAssist";

export interface GenerateWithAiDialogProps {
  open: boolean;
  onClose: () => void;
}

// Quelques exemples de sujets, cliquables pour pré-remplir le champ.
const PROMPT_EXAMPLES: readonly string[] = [
  "Un questionnaire pour mon événement de ce soir sur le thème de l'IA",
  "Une enquête de satisfaction après un atelier de formation",
  "Un sondage pour organiser un repas d'équipe",
];

// Formulaire interne de la boîte de dialogue. Isolé pour être remonté à chaque
// ouverture (via la `key` posée par `GenerateWithAiDialog`) : on repart ainsi
// d'un état propre sans `useEffect` de réinitialisation.
function GenerateWithAiBody({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { generate, pending, error } = useAiAssist();

  const [prompt, setPrompt] = React.useState("");
  const [touched, setTouched] = React.useState(false);

  const trimmedPrompt = prompt.trim();
  const promptError = touched && trimmedPrompt.length === 0;

  const handleClose = () => {
    if (pending) return;
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (trimmedPrompt.length === 0) return;

    try {
      const form = await generate(trimmedPrompt);
      router.push(`/admin/forms/${form.id}/edit`);
    } catch {
      // L'erreur est déjà exposée par `useAiAssist` (état `error`).
    }
  };

  return (
    <Stack component="form" onSubmit={handleSubmit} noValidate>
      <DialogTitle>Générer un questionnaire par IA</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {error ? (
            <Alert severity="error" role="alert">
              {error}
            </Alert>
          ) : null}

          <Typography color="text.secondary" variant="body2">
            {"Décrivez le sujet de votre questionnaire : l'IA propose un brouillon que vous pourrez ensuite affiner dans l'éditeur."}
          </Typography>

          <TextField
            label="Sujet du questionnaire"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onBlur={() => setTouched(true)}
            error={promptError}
            helperText={
              promptError ? "Le sujet du questionnaire est requis." : " "
            }
            autoFocus
            fullWidth
            required
            multiline
            minRows={3}
            disabled={pending}
          />

          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">
              Exemples :
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ flexWrap: "wrap" }}
            >
              {PROMPT_EXAMPLES.map((example) => (
                <Chip
                  key={example}
                  label={example}
                  size="small"
                  variant="outlined"
                  onClick={() => setPrompt(example)}
                  disabled={pending}
                />
              ))}
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={pending}>
          Annuler
        </Button>
        <Button
          type="submit"
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          loading={pending}
          disabled={trimmedPrompt.length === 0}
        >
          Générer
        </Button>
      </DialogActions>
    </Stack>
  );
}

// Boîte de dialogue de génération d'un questionnaire par IA (saisie d'un sujet
// libre + exemples). À la validation, POST `/api/admin/ai/generate` puis
// redirection vers l'éditeur du questionnaire créé. Gère l'état de chargement
// (génération potentiellement longue) et l'erreur serveur. Theme-aware.
//
// Le contenu n'est monté que lorsque la boîte est ouverte, et remonté à chaque
// ouverture (`key={open}`) pour repartir d'un formulaire vierge.
export function GenerateWithAiDialog({
  open,
  onClose,
}: GenerateWithAiDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {open ? <GenerateWithAiBody key={String(open)} onClose={onClose} /> : null}
    </Dialog>
  );
}
