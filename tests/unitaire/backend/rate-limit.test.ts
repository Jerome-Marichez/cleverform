import {
  clientIpFromHeaders,
  createRateLimiter,
} from "@/backend/auth/rateLimit";

// Test unitaire (backend) — limiteur de débit à fenêtre fixe et extraction d'IP.
// L'horloge est injectée (paramètre `now`) : comportement déterministe, sans mock
// du temps ni minuterie réelle.

describe("createRateLimiter (fenêtre fixe)", () => {
  it("autorise jusqu'à la limite puis refuse au-delà", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect(limiter.consume("ip", 0).allowed).toBe(true);
    expect(limiter.consume("ip", 0).allowed).toBe(true);
    expect(limiter.consume("ip", 0).allowed).toBe(true);

    const blocked = limiter.consume("ip", 0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(1);
  });

  it("décompte les tentatives restantes", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.consume("ip", 0).remaining).toBe(1);
    expect(limiter.consume("ip", 0).remaining).toBe(0);
  });

  it("rouvre une fenêtre une fois le délai écoulé", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.consume("ip", 0).allowed).toBe(true);
    expect(limiter.consume("ip", 500).allowed).toBe(false);
    // À `now >= resetAt` (1000), une nouvelle fenêtre s'ouvre.
    expect(limiter.consume("ip", 1000).allowed).toBe(true);
  });

  it("isole les clés les unes des autres", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.consume("ip-a", 0).allowed).toBe(true);
    expect(limiter.consume("ip-a", 0).allowed).toBe(false);
    // Une autre IP dispose de son propre quota.
    expect(limiter.consume("ip-b", 0).allowed).toBe(true);
  });

  it("repart à zéro après reset()", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.consume("ip", 0).allowed).toBe(true);
    expect(limiter.consume("ip", 0).allowed).toBe(false);
    limiter.reset();
    expect(limiter.consume("ip", 0).allowed).toBe(true);
  });
});

describe("clientIpFromHeaders", () => {
  it("retient la première IP de x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.7");
  });

  it("se rabat sur x-real-ip en l'absence de x-forwarded-for", () => {
    const headers = new Headers({ "x-real-ip": "198.51.100.4" });
    expect(clientIpFromHeaders(headers)).toBe("198.51.100.4");
  });

  it("renvoie une clé constante sûre si aucun en-tête n'est présent", () => {
    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
  });
});
