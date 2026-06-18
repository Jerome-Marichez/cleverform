# Bottlenecks & axes d'amélioration

Ce document recense les principaux **goulots d'étranglement** (performance, coût,
scalabilité) et **axes d'amélioration** proposés pour la suite — du runtime IA à
l'**observabilité**, à l'**analytics produit** et aux **arbitrages de déploiement /
packaging**. Il complète — sans les dupliquer — les **« Limites assumées »** de
[`security.md`](./security.md) et les arbitrages de [`architecture.md`](./architecture.md).

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

**État actuel : quasi inexistant.** Il n'y a **aucune instrumentation applicative
dédiée** — pas de logging structuré, pas de suivi d'erreurs, pas de métriques
métier, pas d'alerting. La seule observabilité disponible est celle **fournie par
défaut par la plateforme Vercel** (logs d'exécution des fonctions, analytics de
base), non structurée et non corrélée au métier. Côté code, on s'appuie seulement
sur les **erreurs HTTP typées** de l'IA (502/503) ; rien n'agrège ni n'alerte.

**Axes d'amélioration**

- 🟠 **Logging structuré** (JSON) côté backend (génération IA, soumissions,
  erreurs) avec corrélation par requête.
- 🟠 **Suivi d'erreurs** front + back (ex. Sentry) et **métriques/traçage** (ex.
  OpenTelemetry) : taux d'échec IA, latence de génération, erreurs 5xx.
- 🟢 **Dashboards + alerting** sur les indicateurs clés. Le support concret dépend
  de la cible de déploiement (voir § 8) : **Vercel Observability** en l'état, ou
  **GCP Cloud Logging / Monitoring** (voire Prometheus/Grafana) en self-hosted.
- 🟢 **Analytics produit (comportement utilisateur)** — concern **distinct** de
  l'observabilité technique, **aujourd'hui inexistant** : aucune mesure des parcours
  UI/UX. Un outil **respectueux de la vie privée comme Matomo** (auto-hébergeable,
  configurable **sans cookie / IP anonymisée**) permettrait d'instrumenter
  concrètement :
  - **Heatmaps** (zones de clic / défilement) et **enregistrements de session** pour
    voir où les utilisateurs bloquent sur le Builder et le Responder ;
  - **Form Analytics** : **temps de complétion** d'un formulaire, **temps passé par
    champ**, **champ qui déclenche l'abandon**, taux de conversion ;
  - **entonnoirs (funnels) par question** pour localiser les décrochages, et suivi de
    l'**efficacité de la génération IA** (prompts → questionnaires conservés).

  Objectif : **éclairer les décisions UX par la donnée**, tout en restant cohérent avec
  la **minimisation RGPD** du projet (voir [`rgpd.md`](./rgpd.md)) — Matomo permet une
  configuration sans traceur intrusif.

> **À terme, ce point devra être réellement traité** dès que l'application
> dépassera le cadre de la démo. Piste recommandée : adopter **Sentry** (erreurs
> front + back, avec contexte de release) et **configurer des alertes** sur les
> signaux critiques (échecs IA 502/503, pic de latence de génération, taux d'erreur
> 5xx) pour être notifié avant les utilisateurs.

## 6. Dépendances

- Vulnérabilités **dev-only résiduelles sans correctif** (`elliptic`, `js-yaml`),
  détaillées dans [`security.md`](./security.md) § Dépendances. À **re-auditer à chaque
  montée de version** de l'outillage (Storybook, Jest) — un correctif amont pourra
  permettre de lever les `overrides` / le risque assumé.

## 7. Fonctionnel

- **Administrateur unique** (pas de multi-comptes ni de rôles) : choix volontaire et
  suffisant pour le périmètre. Évolutif vers une véritable **gestion d'utilisateurs**
  (table `User`, rôles, permissions) si le besoin apparaît.

## 8. Architecture de déploiement & packaging (monolithe vs découpage)

Ce n'est pas un défaut mais un **arbitrage assumé**, à réévaluer selon le contexte.

- **Monolithe Next.js (choix actuel)** — front + back dans un seul projet. **Pertinent
  pour ce cas pratique** : une seule CI, un seul déploiement, des **preview URLs**, une
  itération rapide et surtout une **livraison / démonstration simples**. Pour démontrer
  le produit, c'est le bon compromis (pas de surcoût d'orchestration).
- **Cloud managé vs générique vs self-hosted** — déploiement actuel sur **Vercel**
  (intégration Next.js native, preview URLs, observabilité de base). Un **Docker** est
  déjà fourni (voir [`docker.md`](./docker.md)) précisément pour la **portabilité /
  anti vendor lock-in** : l'app peut tourner ailleurs — **GCP Cloud Run**, un VPS,
  Kubernetes — sans dépendre de Vercel. Le choix « **Vercel** (DX, time-to-market) vs
  **GCP/Cloud Run** (contrôle, coût, intégration à une infra existante) vs
  **self-hosted** » **dépend du contexte**, pas d'un dogme ; rien n'enferme puisque la
  logique métier est framework-agnostique dans `shared`.
- **Découpage & réutilisation** — tant que le code **n'est pas réutilisé ailleurs**, le
  monolithe est optimal. **Si** un module devait servir dans d'autres projets, on
  pourrait **l'extraire en package npm versionné** (ou en workspace monorepo) — par
  exemple la **couche domaine** (`src/shared` : entités, schémas Zod, règles pures) ou
  la **couche IA** (`src/backend/ai`). À l'inverse, un **découpage en services / front
  et back séparés** ne se justifie que sous contraintes d'**échelle**, d'**équipes** ou
  de **déploiements indépendants** — surcoût injustifié ici. L'architecture en couches
  (`app` / `frontend` / `backend` / `shared`) rend cette extraction **future** peu
  coûteuse **sans la payer maintenant**.

> En résumé : **monolithe = simplicité / démo / livraison** ; **packaging npm =
> réutilisation cross-projets** ; **Vercel vs GCP/self-hosted = DX vs contrôle**. Le bon
> choix dépend du contexte (réutilisation, échelle, équipe, infra existante).
