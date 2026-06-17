// Limiteur de débit « best-effort » en mémoire (anti-brute-force du login admin).
//
// Fenêtre fixe : chaque clé (ex. une IP) dispose de `limit` tentatives par
// tranche de `windowMs`. Au-delà, les tentatives sont refusées jusqu'à la fin de
// la fenêtre.
//
// ⚠️ Limite connue (voir docs/security.md) : l'état est conservé EN MÉMOIRE, donc
// **par instance** et **éphémère**. En environnement serverless (plusieurs
// instances, redémarrages à froid), ce n'est pas un compteur partagé : c'est un
// ralentisseur, pas une garantie. Une mise en production réelle s'appuierait sur
// un store partagé (Redis/Upstash) ou le rate limiting de la plateforme (WAF).

/** Résultat d'une consommation de quota pour une clé. */
export interface RateLimitResult {
  /** La tentative est-elle autorisée ? */
  allowed: boolean;
  /** Tentatives restantes dans la fenêtre courante. */
  remaining: number;
  /** Secondes avant réouverture (0 si autorisé). */
  retryAfterSeconds: number;
}

/** Paramètres d'un limiteur. */
export interface RateLimiterOptions {
  /** Nombre maximal de tentatives autorisées par fenêtre. */
  limit: number;
  /** Durée de la fenêtre (en millisecondes). */
  windowMs: number;
}

/** État d'une clé : compteur courant et fin de fenêtre. */
interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Crée un limiteur à fenêtre fixe. `consume(key)` enregistre une tentative pour
 * la clé et indique si elle est autorisée. L'horloge (`now`) est injectable afin
 * de rendre le comportement déterministe et testable sans mock du temps.
 */
export function createRateLimiter({ limit, windowMs }: RateLimiterOptions) {
  const buckets = new Map<string, Bucket>();

  function consume(key: string, now: number = Date.now()): RateLimitResult {
    const bucket = buckets.get(key);

    // Pas de fenêtre en cours (ou expirée) : on en ouvre une neuve.
    if (!bucket || now >= bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
    }

    // Fenêtre en cours mais quota épuisé : refus jusqu'à `resetAt`.
    if (bucket.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
      };
    }

    bucket.count += 1;
    return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
  }

  /** Vide tout l'état (utile aux tests et à une éventuelle purge). */
  function reset(): void {
    buckets.clear();
  }

  return { consume, reset };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;

/**
 * Extrait une IP cliente « best-effort » des en-têtes de proxy. Derrière le proxy
 * Vercel, `x-forwarded-for` porte la chaîne des IP ; on retient la première
 * (client d'origine). Repli sur `x-real-ip`, puis sur une clé constante (le
 * limiteur dégénère alors en limite globale, ce qui reste sûr — jamais permissif).
 */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  return headers.get("x-real-ip") ?? "unknown";
}
