"use client";

import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Rating from "@mui/material/Rating";
import Chip from "@mui/material/Chip";
import { QuestionTypeIcon } from "@/frontend/components/form/QuestionTypeIcon";
import type { QuestionAggregate } from "@/backend/response/responseMapper";

export interface QuestionAggregateCardProps {
  /** Agrégat d'une question (union discriminée par `kind`). */
  aggregate: QuestionAggregate;
  /** Nombre maximal de valeurs textuelles affichées (au-delà : « + N autres »). */
  maxValues?: number;
}

// Carte de visualisation d'une question dans le Response Viewer. Affiche, selon
// la famille de la question (`kind`) :
//  - `choice` → barres horizontales proportionnelles (count + pourcentage) ;
//  - `rating` → note moyenne (étoiles en lecture seule + « x.x / 5 ») ;
//  - `value`  → échantillon des valeurs saisies (tronqué si trop long).
// En-tête commun : icône du type + libellé + nombre de réponses. Theme-aware.
export function QuestionAggregateCard({
  aggregate,
  maxValues = 8,
}: QuestionAggregateCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", minWidth: 0 }}
            >
              <QuestionTypeIcon type={aggregate.type} />
              <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                {aggregate.label}
              </Typography>
            </Stack>
            <Chip
              label={`${aggregate.answersCount} réponse${aggregate.answersCount > 1 ? "s" : ""}`}
              size="small"
              variant="outlined"
              sx={{ flexShrink: 0 }}
            />
          </Stack>

          <AggregateBody aggregate={aggregate} maxValues={maxValues} />
        </Stack>
      </CardContent>
    </Card>
  );
}

// Corps de la carte, choisi selon le `kind` (union discriminée).
function AggregateBody({
  aggregate,
  maxValues,
}: {
  aggregate: QuestionAggregate;
  maxValues: number;
}) {
  switch (aggregate.kind) {
    case "choice":
      return <ChoiceBody aggregate={aggregate} />;
    case "rating":
      return <RatingBody aggregate={aggregate} />;
    case "value":
      return <ValueBody aggregate={aggregate} maxValues={maxValues} />;
  }
}

type ChoiceAggregate = Extract<QuestionAggregate, { kind: "choice" }>;
type RatingAggregate = Extract<QuestionAggregate, { kind: "rating" }>;
type ValueAggregate = Extract<QuestionAggregate, { kind: "value" }>;

// `choice` : une barre par option, proportionnelle au plus grand décompte, avec
// le libellé, le compteur et le pourcentage (rapporté au nombre de réponses).
function ChoiceBody({ aggregate }: { aggregate: ChoiceAggregate }) {
  const { options, answersCount } = aggregate;
  // Le pourcentage est rapporté au nombre de réponses (et non au total des
  // sélections), pertinent y compris pour le choix multiple.
  const maxCount = options.reduce((max, option) => Math.max(max, option.count), 0);

  if (options.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        Aucune option.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {options.map((option) => {
        const percent =
          answersCount > 0 ? Math.round((option.count / answersCount) * 100) : 0;
        // Remplissage de la barre relatif à l'option la plus choisie (arrondi).
        const fill =
          maxCount > 0 ? Math.round((option.count / maxCount) * 100) : 0;
        return (
          <Stack key={option.optionId} spacing={0.5}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "baseline", justifyContent: "space-between" }}
            >
              <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                {option.label}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ flexShrink: 0 }}
              >
                {option.count} · {percent}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={fill}
              aria-label={`${option.label} : ${option.count} réponse${option.count > 1 ? "s" : ""} (${percent}%)`}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Stack>
        );
      })}
    </Stack>
  );
}

// `rating` : note moyenne en étoiles (lecture seule) + « x.x / 5 ». Repli si
// aucune note.
function RatingBody({ aggregate }: { aggregate: RatingAggregate }) {
  const { average } = aggregate;

  if (average === null) {
    return (
      <Typography color="text.secondary" variant="body2">
        Aucune note pour le moment.
      </Typography>
    );
  }

  const rounded = Math.round(average * 10) / 10;
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
      <Rating
        value={average}
        precision={0.1}
        readOnly
        aria-label={`Note moyenne : ${rounded} sur 5`}
      />
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {rounded.toFixed(1)} / 5
      </Typography>
    </Stack>
  );
}

// `value` : échantillon des valeurs saisies, tronqué à `maxValues`. Repli « — »
// si aucune valeur.
function ValueBody({
  aggregate,
  maxValues,
}: {
  aggregate: ValueAggregate;
  maxValues: number;
}) {
  const { values } = aggregate;

  if (values.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        —
      </Typography>
    );
  }

  const shown = values.slice(0, maxValues);
  const remaining = values.length - shown.length;

  return (
    <Stack spacing={1}>
      {shown.map((value, index) => (
        <Box
          key={`${index}-${value}`}
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 1,
            bgcolor: "action.hover",
          }}
        >
          <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
            {value}
          </Typography>
        </Box>
      ))}
      {remaining > 0 ? (
        <Typography variant="body2" color="text.secondary">
          + {remaining} autre{remaining > 1 ? "s" : ""}
        </Typography>
      ) : null}
    </Stack>
  );
}
