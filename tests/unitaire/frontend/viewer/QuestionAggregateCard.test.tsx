import * as React from "react";
import { screen, within } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { QuestionAggregateCard } from "@/frontend/components/viewer/QuestionAggregateCard";
import type { QuestionAggregate } from "@/backend/response/responseMapper";

// Tests unitaires de QuestionAggregateCard : rendu selon le `kind` de l'agrégat
// (choice → barres, rating → moyenne, value → valeurs), en-tête (libellé +
// nombre de réponses) et cas « zéro réponse ». Fixtures pures, sans base.

// --- Fixtures ---------------------------------------------------------------

const choiceAggregate: Extract<QuestionAggregate, { kind: "choice" }> = {
  kind: "choice",
  questionId: "q1",
  label: "Quels thèmes vous intéressent ?",
  type: "MULTIPLE_CHOICE",
  answersCount: 4,
  options: [
    { optionId: "o1", label: "IA", count: 3 },
    { optionId: "o2", label: "Cloud", count: 1 },
    { optionId: "o3", label: "Sécurité", count: 0 },
  ],
};

const ratingAggregate: Extract<QuestionAggregate, { kind: "rating" }> = {
  kind: "rating",
  questionId: "q2",
  label: "Notez l'événement",
  type: "RATING",
  answersCount: 2,
  average: 4.5,
};

const valueAggregate: Extract<QuestionAggregate, { kind: "value" }> = {
  kind: "value",
  questionId: "q3",
  label: "Un commentaire ?",
  type: "SHORT_TEXT",
  answersCount: 2,
  values: ["Super soirée", "À refaire"],
};

// --- En-tête commun ---------------------------------------------------------

describe("QuestionAggregateCard — en-tête (unitaire)", () => {
  it("affiche le libellé de la question", () => {
    renderWithTheme(<QuestionAggregateCard aggregate={choiceAggregate} />);
    expect(
      screen.getByText("Quels thèmes vous intéressent ?"),
    ).toBeInTheDocument();
  });

  it("affiche le nombre de réponses (pluriel)", () => {
    renderWithTheme(<QuestionAggregateCard aggregate={choiceAggregate} />);
    expect(screen.getByText("4 réponses")).toBeInTheDocument();
  });

  it("accorde le nombre de réponses au singulier", () => {
    renderWithTheme(
      <QuestionAggregateCard
        aggregate={{ ...choiceAggregate, answersCount: 1 }}
      />,
    );
    expect(screen.getByText("1 réponse")).toBeInTheDocument();
  });
});

// --- kind: "choice" ---------------------------------------------------------

describe("QuestionAggregateCard — choice (unitaire)", () => {
  it("affiche une barre de progression par option", () => {
    renderWithTheme(<QuestionAggregateCard aggregate={choiceAggregate} />);
    expect(screen.getAllByRole("progressbar")).toHaveLength(3);
  });

  it("affiche le libellé de chaque option", () => {
    renderWithTheme(<QuestionAggregateCard aggregate={choiceAggregate} />);
    expect(screen.getByText("IA")).toBeInTheDocument();
    expect(screen.getByText("Cloud")).toBeInTheDocument();
    expect(screen.getByText("Sécurité")).toBeInTheDocument();
  });

  it("affiche le décompte et le pourcentage de chaque option", () => {
    renderWithTheme(<QuestionAggregateCard aggregate={choiceAggregate} />);
    // 3 sur 4 réponses → 75 %.
    expect(screen.getByText("3 · 75%")).toBeInTheDocument();
    // 1 sur 4 réponses → 25 %.
    expect(screen.getByText("1 · 25%")).toBeInTheDocument();
    // Option jamais choisie → 0 %.
    expect(screen.getByText("0 · 0%")).toBeInTheDocument();
  });

  it("remplit chaque barre proportionnellement à l'option la plus choisie", () => {
    renderWithTheme(<QuestionAggregateCard aggregate={choiceAggregate} />);
    const bars = screen.getAllByRole("progressbar");
    // Option max (count 3) → barre pleine (100), puis 1/3 → ~33, puis 0.
    expect(bars[0]).toHaveAttribute("aria-valuenow", "100");
    expect(bars[1]).toHaveAttribute("aria-valuenow", "33");
    expect(bars[2]).toHaveAttribute("aria-valuenow", "0");
  });
});

// --- kind: "rating" ---------------------------------------------------------

describe("QuestionAggregateCard — rating (unitaire)", () => {
  it("affiche la note moyenne en texte « x.x / 5 »", () => {
    renderWithTheme(<QuestionAggregateCard aggregate={ratingAggregate} />);
    expect(screen.getByText("4.5 / 5")).toBeInTheDocument();
  });

  it("expose la note moyenne accessible (étoiles en lecture seule)", () => {
    renderWithTheme(<QuestionAggregateCard aggregate={ratingAggregate} />);
    expect(
      screen.getByLabelText("Note moyenne : 4.5 sur 5"),
    ).toBeInTheDocument();
  });

  it("affiche un repli quand aucune note n'a été donnée", () => {
    renderWithTheme(
      <QuestionAggregateCard
        aggregate={{ ...ratingAggregate, answersCount: 0, average: null }}
      />,
    );
    expect(
      screen.getByText("Aucune note pour le moment."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\/ 5$/)).not.toBeInTheDocument();
  });
});

// --- kind: "value" ----------------------------------------------------------

describe("QuestionAggregateCard — value (unitaire)", () => {
  it("affiche les valeurs saisies", () => {
    renderWithTheme(<QuestionAggregateCard aggregate={valueAggregate} />);
    expect(screen.getByText("Super soirée")).toBeInTheDocument();
    expect(screen.getByText("À refaire")).toBeInTheDocument();
  });

  it("tronque au-delà de maxValues et indique le reste", () => {
    renderWithTheme(
      <QuestionAggregateCard
        aggregate={{
          ...valueAggregate,
          answersCount: 5,
          values: ["a", "b", "c", "d", "e"],
        }}
        maxValues={3}
      />,
    );
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("c")).toBeInTheDocument();
    expect(screen.queryByText("d")).not.toBeInTheDocument();
    expect(screen.getByText("+ 2 autres")).toBeInTheDocument();
  });

  it("affiche un repli « — » quand aucune valeur n'a été saisie", () => {
    renderWithTheme(
      <QuestionAggregateCard
        aggregate={{ ...valueAggregate, answersCount: 0, values: [] }}
      />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

// --- Cas « zéro réponse » (toutes familles) ---------------------------------

describe("QuestionAggregateCard — zéro réponse (unitaire)", () => {
  it("choice : barres à 0, en-tête « 0 réponse »", () => {
    renderWithTheme(
      <QuestionAggregateCard
        aggregate={{
          ...choiceAggregate,
          answersCount: 0,
          options: [
            { optionId: "o1", label: "IA", count: 0 },
            { optionId: "o2", label: "Cloud", count: 0 },
          ],
        }}
      />,
    );
    expect(screen.getByText("0 réponse")).toBeInTheDocument();
    const bars = screen.getAllByRole("progressbar");
    expect(bars).toHaveLength(2);
    for (const bar of bars) {
      expect(bar).toHaveAttribute("aria-valuenow", "0");
    }
  });

  it("rating : repli sans note", () => {
    renderWithTheme(
      <QuestionAggregateCard
        aggregate={{ ...ratingAggregate, answersCount: 0, average: null }}
      />,
    );
    expect(screen.getByText("0 réponse")).toBeInTheDocument();
    expect(screen.getByText("Aucune note pour le moment.")).toBeInTheDocument();
  });

  it("value : repli « — »", () => {
    renderWithTheme(
      <QuestionAggregateCard
        aggregate={{ ...valueAggregate, answersCount: 0, values: [] }}
      />,
    );
    const card = screen.getByText("Un commentaire ?").closest(".MuiCard-root");
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText("—")).toBeInTheDocument();
  });
});
