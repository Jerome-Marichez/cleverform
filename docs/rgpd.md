# RGPD — protection des données

Cette page documente la conformité **RGPD** de CleverForm et tient le **registre des activités de
traitement** (RGPD art. 30). Elle complète [`security.md`](./security.md), qui décrit les mesures
techniques (cloisonnement admin/public, validation, minimisation).

> **À tenir à jour** : toute évolution touchant des données personnelles (nouveau champ collecté,
> nouvelle finalité, changement de durée de conservation, nouveau destinataire) **doit** être
> reportée dans le registre ci-dessous **dans la même PR**.

## Responsable de traitement

- **Responsable** : Jérôme Marichez
- **Contact** : `jeromemarichez@ik.me`

## Principes appliqués

- **Minimisation** : seules les données strictement nécessaires sont collectées. Une soumission ne
  stocke que `submittedAt` + les réponses — **aucune adresse IP, aucun cookie, aucun traceur, aucun
  user-agent** côté public.
- **Information (art. 13)** : une mention de confidentialité (`PrivacyNotice`) est présentée au
  répondant avant l'envoi.
- **Base légale = consentement** : une case de consentement **obligatoire** précède la soumission.
- **Droit à l'effacement** : la suppression d'un questionnaire efface ses réponses en cascade
  (`onDelete: Cascade`).
- **Pas de transfert hors UE**, pas de décision automatisée, pas de profilage.

## Registre des activités de traitement (art. 30)

> Ce registre est également disponible au format réutilisable :
> [`rgpd-registre.csv`](./rgpd-registre.csv) (une ligne par traitement). Les deux versions doivent
> rester synchronisées dans la même PR.

### Traitement n°1 — Collecte des réponses aux questionnaires

| Champ | Valeur |
|-------|--------|
| **Finalité** | Recueillir et exploiter les réponses aux questionnaires diffusés |
| **Base légale** | Consentement du répondant (case obligatoire avant envoi) |
| **Personnes concernées** | Répondants aux questionnaires (public) |
| **Catégories de données** | Réponses saisies : texte libre, choix, notes, nombres, dates ; **adresse e-mail** si une question de type `EMAIL` est posée. Horodatage de soumission (`submittedAt`). |
| **Données sensibles** | Aucune collecte intentionnelle (pas de catégorie particulière art. 9) |
| **Destinataires** | Le responsable de traitement (espace admin protégé) uniquement |
| **Sous-traitants / hébergement** | Hébergement applicatif et base de données (PostgreSQL) — voir [`docker.md`](./docker.md) / [`ci-cd.md`](./ci-cd.md) |
| **Transferts hors UE** | Aucun |
| **Durée de conservation** | Jusqu'à la **suppression du questionnaire** par l'administrateur (effacement en cascade) |
| **Mesures de sécurité** | Surface publique **write-only**, identifiant public opaque, validation Zod côté serveur, tailles bornées, requêtes paramétrées (Prisma). Détail : [`security.md`](./security.md) |

### Traitement n°2 — Authentification de l'administrateur

| Champ | Valeur |
|-------|--------|
| **Finalité** | Protéger l'accès à l'espace d'administration (création, gestion, lecture des réponses) |
| **Base légale** | Intérêt légitime (sécurité de l'accès) |
| **Personnes concernées** | Administrateur unique (le responsable) |
| **Catégories de données** | Identifiants de connexion (issus de la configuration, **pas de table `User`**), cookie de **session** (essentiel) |
| **Destinataires** | Le responsable uniquement |
| **Transferts hors UE** | Aucun |
| **Durée de conservation** | Le temps de la session ; aucun journal d'authentification persistant |
| **Mesures de sécurité** | Limitation de débit par IP au login (anti-brute-force), cookie de session, `middleware` de protection des routes `/admin`. Détail : [`security.md`](./security.md) |

## Exercice des droits

Les répondants disposent d'un droit d'**accès**, de **rectification**, d'**effacement**,
d'**opposition** et de **limitation**. Ils l'exercent en écrivant à `jeromemarichez@ik.me`. Le
responsable identifie les réponses concernées et procède à la suppression (effacement en cascade
des réponses lors de la suppression du questionnaire).

## Limites assumées

- Le **consentement n'est pas horodaté/persisté** (pas de preuve stockée) : il est un prérequis
  bloquant à la soumission. À faire évoluer si une preuve de consentement est exigée.
- Pas de page publique de politique de confidentialité dédiée : l'information tient dans la mention
  affichée sur le formulaire (`PrivacyNotice`).
