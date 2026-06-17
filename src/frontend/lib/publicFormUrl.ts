// Construction de l'URL **publique** d'un questionnaire (Form Responder).
//
// Seul `publicId` (jeton opaque) est exposé — jamais l'`id` interne. L'URL est
// absolue afin d'être directement copiable / partageable : elle repose sur
// `window.location.origin`, et n'a donc de sens que côté client (au clic).

/** Chemin public relatif d'un questionnaire (`/f/<publicId>`). */
export function publicFormPath(publicId: string): string {
  return `/f/${publicId}`;
}

/**
 * URL **absolue** du questionnaire public, dérivée de l'origine courante.
 * Repli sur le chemin relatif si `window` est indisponible (rendu serveur).
 */
export function buildPublicFormUrl(publicId: string): string {
  const path = publicFormPath(publicId);
  if (typeof window === "undefined") {
    return path;
  }
  return `${window.location.origin}${path}`;
}
