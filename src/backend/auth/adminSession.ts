// Authentification « administrateur unique » (voir docs/security.md).
//
// Pas de table `User` : un seul administrateur, identifié par un mot de passe
// (`ADMIN_PASSWORD`). La session est matérialisée par un **jeton signé HMAC**
// (`SESSION_SECRET`) déposé dans un cookie `httpOnly`.
//
// Choix de la **Web Crypto API** (`globalThis.crypto.subtle`) plutôt que de
// `node:crypto` : elle est disponible à la fois dans le runtime Node (routes) et
// dans le runtime du middleware Next.js, ce qui évite tout écart de compatibilité.
// Toutes les opérations cryptographiques sont donc asynchrones.

// --- Cookie de session ---------------------------------------------------------

/** Nom du cookie de session admin. */
export const SESSION_COOKIE_NAME = "cc_admin_session";

/** Durée de vie de la session (en secondes) : 7 jours. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/**
 * Attributs du cookie de session admin.
 * `secure` n'est activé qu'en production (en local, HTTP sans TLS).
 */
export function sessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

/** Attributs du cookie pour l'effacer (déconnexion). */
export function clearedSessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return { ...sessionCookieOptions(), maxAge: 0 };
}

// --- Secret & primitives -------------------------------------------------------

/** Lit `SESSION_SECRET` ; échoue clairement si absent. */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET est manquant (voir .env.example).");
  }
  return secret;
}

/** Lit `ADMIN_PASSWORD` ; échoue clairement si absent. */
function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD est manquant (voir .env.example).");
  }
  return password;
}

const encoder = new TextEncoder();

/** Encode des octets en base64url (sans `+`, `/`, ni `=`), compatible URL/cookie. */
function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Importe le secret en clé HMAC SHA-256 (usage signature/vérification). */
async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

/** Calcule la signature HMAC-SHA256 d'un message, en base64url. */
async function signMessage(message: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toBase64Url(new Uint8Array(signature));
}

/**
 * Comparaison de chaînes à **temps constant** (anti timing-attack).
 * Indépendante de la position du premier octet divergent ; ne court-circuite
 * que sur une différence de longueur (non secrète ici).
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// --- Jeton de session ----------------------------------------------------------

/** Charge utile du jeton de session. */
export interface SessionPayload {
  /** Sujet : administrateur unique. */
  sub: "admin";
  /** Date d'expiration (timestamp Unix en secondes). */
  exp: number;
}

/**
 * Crée un jeton de session signé pour l'administrateur, au format
 * `payloadBase64Url.signatureBase64Url`. Expire après `maxAgeSeconds`.
 */
export async function createSessionToken(
  maxAgeSeconds: number = SESSION_MAX_AGE,
): Promise<string> {
  const secret = getSessionSecret();
  const payload: SessionPayload = {
    sub: "admin",
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await signMessage(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

/**
 * Vérifie un jeton de session : intégrité de la signature (temps constant) et
 * non-expiration. Renvoie la charge utile si valide, sinon `null`.
 */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }
  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) {
    return null;
  }

  const secret = getSessionSecret();
  const expectedSignature = await signMessage(encodedPayload, secret);
  if (!timingSafeEqual(signature, expectedSignature)) {
    return null;
  }

  let payload: SessionPayload;
  try {
    const json = atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/"));
    payload = JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }

  if (payload.sub !== "admin" || typeof payload.exp !== "number") {
    return null;
  }
  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
}

// --- Mot de passe --------------------------------------------------------------

/**
 * Valide le mot de passe administrateur par comparaison à temps constant avec
 * `ADMIN_PASSWORD`. La comparaison porte sur les empreintes HMAC des deux valeurs
 * (avec `SESSION_SECRET` comme clé) afin que la durée ne dépende ni de la longueur
 * ni du contenu du mot de passe attendu.
 */
export async function validateAdminPassword(input: string): Promise<boolean> {
  const expected = getAdminPassword();
  const secret = getSessionSecret();
  const [inputDigest, expectedDigest] = await Promise.all([
    signMessage(input, secret),
    signMessage(expected, secret),
  ]);
  return timingSafeEqual(inputDigest, expectedDigest);
}
