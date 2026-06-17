// Test unitaire (backend) — session administrateur (signature HMAC + mot de passe).
//
// Les fonctions reposent sur la Web Crypto API (asynchrone) et lisent les secrets
// depuis l'environnement : on fixe `SESSION_SECRET` et `ADMIN_PASSWORD` ici.
// Aucune dépendance à une base de données ni au réseau (fixtures uniquement).

const SECRET = "secret-de-test-suffisamment-long-pour-hmac";
const PASSWORD = "mot-de-passe-admin";

beforeAll(() => {
  process.env.SESSION_SECRET = SECRET;
  process.env.ADMIN_PASSWORD = PASSWORD;
});

// Import après fixation de l'environnement (les helpers lisent process.env à l'appel).
import {
  createSessionToken,
  verifySessionToken,
  validateAdminPassword,
} from "@/backend/auth/adminSession";

describe("adminSession — jeton de session (unitaire)", () => {
  it("vérifie avec succès un jeton fraîchement signé", async () => {
    const token = await createSessionToken();
    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe("admin");
    expect(typeof payload?.exp).toBe("number");
  });

  it("refuse un jeton dont la signature a été falsifiée", async () => {
    const token = await createSessionToken();
    const [payload] = token.split(".");
    const tampered = `${payload}.signatureinvalide`;
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("refuse un jeton dont la charge utile a été modifiée", async () => {
    const token = await createSessionToken();
    const [, signature] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: "admin", exp: 9999999999 }),
    ).toString("base64url");
    const forged = `${forgedPayload}.${signature}`;
    expect(await verifySessionToken(forged)).toBeNull();
  });

  it("refuse un jeton expiré", async () => {
    // Durée de vie négative → expiration dans le passé.
    const expired = await createSessionToken(-10);
    expect(await verifySessionToken(expired)).toBeNull();
  });

  it("refuse un jeton mal formé ou absent", async () => {
    expect(await verifySessionToken(undefined)).toBeNull();
    expect(await verifySessionToken(null)).toBeNull();
    expect(await verifySessionToken("")).toBeNull();
    expect(await verifySessionToken("sans-point")).toBeNull();
    expect(await verifySessionToken("trop.de.points")).toBeNull();
  });

  it("refuse un jeton signé avec un autre secret", async () => {
    const token = await createSessionToken();
    process.env.SESSION_SECRET = "un-autre-secret-totalement-different";
    try {
      expect(await verifySessionToken(token)).toBeNull();
    } finally {
      process.env.SESSION_SECRET = SECRET;
    }
  });
});

describe("adminSession — validation du mot de passe (unitaire)", () => {
  it("accepte le bon mot de passe", async () => {
    expect(await validateAdminPassword(PASSWORD)).toBe(true);
  });

  it("refuse un mauvais mot de passe", async () => {
    expect(await validateAdminPassword("mauvais")).toBe(false);
    expect(await validateAdminPassword("")).toBe(false);
    expect(await validateAdminPassword(`${PASSWORD} `)).toBe(false);
  });
});

describe("adminSession — secrets manquants (unitaire)", () => {
  it("échoue clairement si SESSION_SECRET est absent", async () => {
    const original = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    try {
      await expect(createSessionToken()).rejects.toThrow(/SESSION_SECRET/);
    } finally {
      process.env.SESSION_SECRET = original;
    }
  });

  it("échoue clairement si ADMIN_PASSWORD est absent", async () => {
    const original = process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD;
    try {
      await expect(validateAdminPassword("x")).rejects.toThrow(/ADMIN_PASSWORD/);
    } finally {
      process.env.ADMIN_PASSWORD = original;
    }
  });
});
