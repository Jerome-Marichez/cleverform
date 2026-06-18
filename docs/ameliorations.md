# Bottlenecks & axes d'amélioration

Ce document recense les principaux **goulots d'étranglement** (performance, coût,
scalabilité) et les **axes d'amélioration** proposés pour la suite. Il complète —
sans les dupliquer — les **« Limites assumées »** de [`security.md`](./security.md)
et les arbitrages de [`architecture.md`](./architecture.md).

> Cadre du projet : cas pratique technique, périmètre volontairement resserré.
> Les points ci-dessous sont des **pistes assumées comme hors périmètre actuel**,
> pas des défauts non identifiés. Priorisation indicative : 🔴 fort impact /
> 🟠 moyen / 🟢 confort.

## 1. IA — coût & latence

**Bottlenecks**

- **Génération synchrone** dans la requête HTTP : `aiService.generateForm` appelle
  Anthropic (`aiClient.callClaude`) **sans streaming** et la requête HTTP reste
  ouverte pendant toute la génération → latence perçue et **risque de timeout**
  en environnement serverless sur les prompts lourds.
- **Retry ×2** : en cas de sortie invalide, l'appel est rejoué une fois → le coût
  et la latence **pire-cas doublent**.
- **`MAX_TOKENS = 4096`** (`aiClient.ts`) surdimensionne la sortie : un
  questionnaire de 4–8 questions tient largement en ~1 500 tokens. Comme le coût
  est **dominé par la sortie** (voir le calcul dans [`architecture.md`](./architecture.md),
  § « Couche IA »), ce plafond est le principal levier de coût.

**Axes d'amélioration**

- 🔴 **Réduire `MAX_TOKENS`** (~1 500) : abaisse directement le coût plafond ; à
  valider contre le risque de troncature.
- 🟠 **Streaming** de la génération (retour progressif → meilleure UX d'attente).
- 🟠 **Génération asynchrone** (job + statut) pour s'affranchir du timeout serverless
  sur les cas longs.
- 🟢 **Prompt caching** du prompt système si le volume d'appels augmente.
- 🟢 **Mesurer les tokens réels** (`count_tokens`) pour remplacer les estimations de
  coût par des valeurs observées.

## 2. Sécurité & abus

**Bottlenecks / limites** (voir aussi [`security.md`](./security.md) § Limites assumées)

- **Rate limiting login en mémoire** (`/api/auth/login`) : best-effort, **non
  partagé entre instances** serverless ni persistant.
- **Soumission publique et génération IA non limitées en fréquence** (seulement en
  taille) → exposition au spam et à la consommation IA.

**Axes d'amélioration**

- 🔴 **Store partagé** (Redis/Upstash) ou **rate limiting plateforme** (Vercel
  Firewall / WAF) pour un compteur fiable et distribué.
- 🟠 **Limiter la fréquence des générations IA** (protège le coût).
- 🟠 **CAPTCHA / anti-spam** sur le Form Responder public.

## 3. RGPD

**Limite**

- Le **consentement n'est pas horodaté/persisté** : c'est un prérequis bloquant à
  la soumission, mais sans **preuve** stockée (voir [`rgpd.md`](./rgpd.md)).

**Axe d'amélioration**

- 🟠 Persister une **preuve de consentement** (horodatage + version de la mention de
  confidentialité affichée).

## 4. Données & scalabilité

**Bottleneck**

- **Agrégation des réponses en mémoire** : `responseService` lit **toutes** les
  réponses d'un questionnaire (`responseRepository.findMany`) puis agrège côté
  applicatif (`aggregateResponses`), **sans pagination**. Acceptable au volume d'un
  cas pratique, mais coûteux en mémoire/latence si un questionnaire accumule
  beaucoup de réponses.

**Axes d'amélioration**

- 🟠 **Agrégation/comptage côté SQL** (`count`, `group by`) plutôt qu'en mémoire pour
  les statistiques.
- 🟠 **Pagination** de la consultation des réponses (Response Viewer).
- 🟢 **Index** sur les clés d'accès (`publicId`, `formId`) et **cache de lecture** pour
  les formulaires publiés très consultés.

## 5. Observabilité & exploitation

**Manque**

- Pas de **logging structuré**, de **métriques** ni d'**alerting** documentés (au-delà
  des erreurs HTTP typées de l'IA : 502/503).

**Axes d'amélioration**

- 🟠 Logs structurés + monitoring (taux d'échec IA, latence de génération, erreurs
  5xx) et un tableau de bord d'exploitation.

## 6. Dépendances

- Vulnérabilités **dev-only résiduelles sans correctif** (`elliptic`, `js-yaml`),
  détaillées dans [`security.md`](./security.md) § Dépendances. À **re-auditer à chaque
  montée de version** de l'outillage (Storybook, Jest) — un correctif amont pourra
  permettre de lever les `overrides` / le risque assumé.

## 7. Fonctionnel

- **Administrateur unique** (pas de multi-comptes ni de rôles) : choix volontaire et
  suffisant pour le périmètre. Évolutif vers une véritable **gestion d'utilisateurs**
  (table `User`, rôles, permissions) si le besoin apparaît.
