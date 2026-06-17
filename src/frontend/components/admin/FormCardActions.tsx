"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PublishIcon from "@mui/icons-material/PublishOutlined";
import LockIcon from "@mui/icons-material/LockOutlined";
import LinkIcon from "@mui/icons-material/LinkOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { StatusSnackbar } from "@/frontend/components/states/StatusSnackbar";
import { useFormMutations } from "@/frontend/hooks/useFormMutations";
import { useCopyToClipboard } from "@/frontend/hooks/useCopyToClipboard";
import { buildPublicFormUrl } from "@/frontend/lib/publicFormUrl";
import type { FormStatus } from "@/shared/schemas";

export interface FormCardActionsProps {
  /** Identifiant interne du questionnaire. */
  id: string;
  /** Jeton opaque d'accès public (`/f/<publicId>`), pour partager le lien. */
  publicId: string;
  /** Titre affiché dans la confirmation de suppression. */
  title: string;
  /** Statut courant : conditionne les actions disponibles. */
  status: FormStatus;
}

interface Toast {
  message: string;
  severity: "success" | "error";
}

// Menu d'actions d'une carte de questionnaire (dashboard admin) :
//  - publier (DRAFT → PUBLISHED) ou clôturer (PUBLISHED → CLOSED) ;
//  - supprimer, avec confirmation explicite.
// Après une mutation réussie, rafraîchit la liste (`router.refresh()`) et
// confirme via un toast (`StatusSnackbar`). Les erreurs sont signalées de même.
export function FormCardActions({
  id,
  publicId,
  title,
  status,
}: FormCardActionsProps) {
  const router = useRouter();
  const { changeStatus, deleteForm, pending } = useFormMutations();
  const { copy } = useCopyToClipboard();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [toast, setToast] = React.useState<Toast | null>(null);

  const menuOpen = Boolean(anchorEl);

  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    // Évite que le clic ne propage vers la carte cliquable (navigation édition).
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => setAnchorEl(null);

  const handlePublish = async () => {
    closeMenu();
    try {
      await changeStatus(id, "PUBLISHED");
      setToast({ message: "Questionnaire publié.", severity: "success" });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Action impossible.",
        severity: "error",
      });
    }
  };

  const handleCopyLink = async () => {
    closeMenu();
    const copied = await copy(buildPublicFormUrl(publicId));
    setToast(
      copied
        ? { message: "Lien copié dans le presse-papier.", severity: "success" }
        : { message: "Copie impossible. Copiez le lien manuellement.", severity: "error" },
    );
  };

  const handleClose = async () => {
    closeMenu();
    try {
      await changeStatus(id, "CLOSED");
      setToast({ message: "Questionnaire clôturé.", severity: "success" });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Action impossible.",
        severity: "error",
      });
    }
  };

  const openConfirm = () => {
    closeMenu();
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteForm(id);
      setConfirmOpen(false);
      setToast({ message: "Questionnaire supprimé.", severity: "success" });
      router.refresh();
    } catch (error) {
      setConfirmOpen(false);
      setToast({
        message:
          error instanceof Error ? error.message : "Suppression impossible.",
        severity: "error",
      });
    }
  };

  return (
    <>
      <IconButton
        aria-label="Actions du questionnaire"
        onClick={openMenu}
        size="small"
      >
        <MoreVertIcon />
      </IconButton>

      <Menu anchorEl={anchorEl} open={menuOpen} onClose={closeMenu}>
        {status === "DRAFT" ? (
          <MenuItem onClick={handlePublish} disabled={pending}>
            <ListItemIcon>
              <PublishIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Publier</ListItemText>
          </MenuItem>
        ) : null}

        {status === "PUBLISHED" ? (
          <MenuItem onClick={handleCopyLink}>
            <ListItemIcon>
              <LinkIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copier le lien</ListItemText>
          </MenuItem>
        ) : null}

        {status === "PUBLISHED" ? (
          <MenuItem onClick={handleClose} disabled={pending}>
            <ListItemIcon>
              <LockIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Clôturer</ListItemText>
          </MenuItem>
        ) : null}

        {status !== "CLOSED" ? <Divider /> : null}

        <MenuItem onClick={openConfirm} disabled={pending}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: "error.main" }}>Supprimer</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Supprimer le questionnaire ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Le questionnaire «&nbsp;{title}&nbsp;» et toutes ses réponses seront
            définitivement supprimés. Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={pending}>
            Annuler
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            loading={pending}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <StatusSnackbar
        open={Boolean(toast)}
        message={toast?.message ?? ""}
        severity={toast?.severity ?? "success"}
        onClose={() => setToast(null)}
      />
    </>
  );
}
