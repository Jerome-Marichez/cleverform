"use client";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export default function Home() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Stack spacing={3}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
          CleverConnect
        </Typography>
        <Typography color="text.secondary">
          Mini-clone de Typeform — créez, diffusez et analysez vos questionnaires.
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" href="/admin">
            Créer un questionnaire
          </Button>
          <Button variant="outlined" href="/admin">
            Voir les réponses
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
