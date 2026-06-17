"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

// Mention de confidentialité (RGPD, art. 13) affichée sur la page de remplissage
// publique, juste avant la case de consentement. Présentational et theme-aware.
//
// Contenu volontairement factuel et minimal, en cohérence avec la collecte de
// l'application (voir docs/security.md) : responsable de traitement, finalité,
// base légale (consentement), durée de conservation et droits du répondant.

/** Adresse de contact du responsable de traitement. */
const CONTACT_EMAIL = "jeromemarichez@ik.me";

export function PrivacyNotice() {
  return (
    <Box
      component="section"
      aria-label="Mention de confidentialité"
      sx={{
        p: 2,
        borderRadius: 1,
        bgcolor: "action.hover",
        border: 1,
        borderColor: "divider",
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        Confidentialité de vos réponses
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Vos réponses sont collectées par <strong>Jérôme Marichez</strong> dans le
        seul but d&apos;exploiter ce questionnaire. Elles sont
        conservées jusqu&apos;à la suppression du questionnaire par son
        administrateur. Conformément au RGPD, vous disposez d&apos;un droit
        d&apos;accès, de rectification, d&apos;effacement et d&apos;opposition,
        en écrivant à{" "}
        <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>. La base
        légale du traitement est votre consentement, recueilli ci-dessous.
      </Typography>
    </Box>
  );
}
