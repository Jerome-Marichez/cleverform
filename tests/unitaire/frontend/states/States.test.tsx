import * as React from "react";
import { screen, fireEvent } from "@testing-library/react";
import Button from "@mui/material/Button";
import { renderWithTheme } from "../renderWithTheme";
import { LoadingState } from "@/frontend/components/states/LoadingState";
import { ErrorState } from "@/frontend/components/states/ErrorState";
import { EmptyState } from "@/frontend/components/states/EmptyState";
import { StatusSnackbar } from "@/frontend/components/states/StatusSnackbar";

// Tests unitaires des états transverses : chargement, erreur, vide et toast.

describe("LoadingState (unitaire)", () => {
  it("variante spinner : affiche un indicateur et le libellé par défaut", () => {
    renderWithTheme(<LoadingState />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("Chargement…")).toBeInTheDocument();
  });

  it("variante spinner : marque la zone comme occupée (aria-busy)", () => {
    const { container } = renderWithTheme(<LoadingState label="Patientez" />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.getByText("Patientez")).toBeInTheDocument();
  });

  it("variante skeleton : n'affiche pas de spinner et reste occupée", () => {
    const { container } = renderWithTheme(
      <LoadingState variant="skeleton" rows={4} />,
    );
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    const busy = container.querySelector('[aria-busy="true"]');
    expect(busy).not.toBeNull();
    // 4 esquisses de lignes demandées.
    expect(busy!.querySelectorAll(".MuiSkeleton-root")).toHaveLength(4);
  });
});

describe("ErrorState (unitaire)", () => {
  it("affiche le titre par défaut", () => {
    renderWithTheme(<ErrorState />);
    expect(screen.getByText("Une erreur est survenue")).toBeInTheDocument();
  });

  it("expose le rôle alert", () => {
    renderWithTheme(<ErrorState message="Détail" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("affiche le message détaillé fourni", () => {
    renderWithTheme(<ErrorState message="Connexion perdue" />);
    expect(screen.getByText("Connexion perdue")).toBeInTheDocument();
  });

  it("affiche le bouton de reprise et déclenche onRetry", () => {
    const onRetry = jest.fn();
    renderWithTheme(<ErrorState onRetry={onRetry} />);
    const button = screen.getByRole("button", { name: /Réessayer/ });
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("n'affiche pas de bouton sans onRetry", () => {
    renderWithTheme(<ErrorState />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("EmptyState (unitaire)", () => {
  it("affiche le titre", () => {
    renderWithTheme(<EmptyState title="Aucune réponse" />);
    expect(screen.getByText("Aucune réponse")).toBeInTheDocument();
  });

  it("affiche la description quand elle est fournie", () => {
    renderWithTheme(
      <EmptyState title="Vide" description="Rien à afficher pour l'instant" />,
    );
    expect(
      screen.getByText("Rien à afficher pour l'instant"),
    ).toBeInTheDocument();
  });

  it("rend l'action fournie", () => {
    renderWithTheme(
      <EmptyState title="Vide" action={<Button>Créer</Button>} />,
    );
    expect(screen.getByRole("button", { name: "Créer" })).toBeInTheDocument();
  });
});

describe("StatusSnackbar (unitaire)", () => {
  it("affiche le message quand open est vrai", () => {
    renderWithTheme(
      <StatusSnackbar open message="Enregistré" onClose={() => {}} />,
    );
    expect(screen.getByText("Enregistré")).toBeInTheDocument();
  });

  it("n'affiche rien quand open est faux", () => {
    renderWithTheme(
      <StatusSnackbar open={false} message="Caché" onClose={() => {}} />,
    );
    expect(screen.queryByText("Caché")).not.toBeInTheDocument();
  });

  it("applique la sévérité (error → rôle alert)", () => {
    renderWithTheme(
      <StatusSnackbar
        open
        message="Échec"
        severity="error"
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Échec");
  });

  it("déclenche onClose au clic sur le bouton de fermeture", () => {
    const onClose = jest.fn();
    renderWithTheme(
      <StatusSnackbar open message="Info" onClose={onClose} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
