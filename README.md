# Obsidiane Auth

Service d’authentification **stateless** pour applications web & SPA, basé sur **Lexik JWT (HS256)** et **Gesdinet
Refresh Tokens**.  
Il fournit un login centré **cookies HttpOnly** (`__Secure-at` / `__Host-rt`), des endpoints API simples et une
protection **CSRF stateless** (Symfony).

> UI intégrée (Twig + Vue), tokens en cookies sécurisés, refresh rotatif, vérification d’email, prêts pour la prod.

---

## Sommaire

- [Vue d’ensemble](#vue-densemble)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Démarrage rapide](#démarrage-rapide)
- [API & flux principaux](#api--flux-principaux)
- [Intégration front (SPA)](#intégration-front-spa)
- [Configuration & déploiement](#configuration--déploiement)
- [SDKs](#sdks)
- [Notes de sécurité](#notes-de-sécurité)
- [Contribuer](#contribuer)
- [Licence](#licence)

---

## Vue d’ensemble

- **Dual-mode** :
    - UI : pages `/login`, `/register`, `/reset-password`.
    - API : endpoints sous `/api/auth/...` (login, me, register, logout, refresh, password, invite) pour front SPA/mobile.
- **Sessions** :
    - JWT court-terme en cookie `__Secure-at`.
    - Refresh token opaque en base + cookie `__Host-rt` rotatif (single-use).
- **Sécurité** :
    - CSRF stateless via en-tête `csrf-token` + Origin/Referer (voir section dédiée).
    - Rate limiting sur login et reset.
    - Vérification d’email via lien signé `/verify-email`.
- **Première exécution** :
    - Tant qu’aucun utilisateur n’existe, les pages publiques redirigent vers `/setup` pour créer l’admin initial (
      `ROLE_ADMIN`).
- Interface et emails **en français**.

---

## Fonctionnalités

- **UI Twig + Vue**
    - `GET /login` – Connexion.
    - `GET /register` – Inscription.
    - `GET /reset-password` – Demande de réinitialisation.
    - `GET /reset-password/reset/{token}` – Saisie du nouveau mot de passe.
    - `GET /setup` – Création de l’admin initial si la base est vide.
    - `GET /invite/complete` – Compléter une invitation (création de mot de passe).

- **API JSON**
    - `POST /api/auth/login`
    - `GET /api/auth/me`
    - `POST /api/auth/register`
    - `POST /api/auth/logout`
    - `POST /api/auth/refresh`
    - `POST /api/auth/password/forgot`
    - `POST /api/auth/password/reset`
    - `POST /api/auth/invite` – Inviter un utilisateur (admin uniquement).
    - `POST /api/auth/invite/complete` – Compléter une invitation (définir profil + mot de passe).

- **Cookies & tokens**
    - `__Secure-at` : access token JWT (HttpOnly).
    - `__Host-rt` : refresh token opaque, single-use (HttpOnly).
    - CSRF stateless : jetons aléatoires générés côté client et envoyés dans l’en-tête `csrf-token` pour chaque requête sensible.

---

## Architecture

- **Access token (JWT)**
    - Claims standard (`iss`, `aud`, `sub`, `iat`, `nbf`, `exp`, `jti`).
    - Stocké dans le cookie `__Secure-at` (HttpOnly, SameSite configurable).
    - Utilisé pour authentifier les appels API (pas besoin d’`Authorization: Bearer` côté navigateur).

- **Refresh token (opaque)**
    - Persisté en base, associé à l’utilisateur.
    - Stocké en cookie `__Host-rt` (HttpOnly, host-only, `SameSite=strict`).
    - Rotatif : à chaque `POST /api/auth/refresh`, l’ancien est invalidé.

- **CSRF stateless**
    - Protection basée sur `Origin`/`Referer` + jetons générés côté client.
    - UI & SPA : génèrent un token aléatoire par requête et l’envoient dans l’en-tête `csrf-token`.

- **Vérification d’email**
    - Chaque inscription envoie un email avec lien signé `/verify-email`.
    - Tant que `isEmailVerified=false`, le login renvoie `EMAIL_NOT_VERIFIED`.

---

## Démarrage rapide

Par défaut, `docker compose` expose le service sur `http://localhost:8000`.

### Installation

```bash
# Dépendances PHP
composer install

# Démarrer les services
docker compose up -d

# Migrations
php bin/console doctrine:migrations:migrate
````

### URLs utiles (dev)

* UI :

    * `http://localhost:8000/login`
    * `http://localhost:8000/register`
    * `http://localhost:8000/reset-password`
* Setup initial :

    * `http://localhost:8000/setup` (tant que la base ne contient aucun user).
* API :

    * `http://localhost:8000/api/auth/login`
    * `http://localhost:8000/api/auth/me`
    * `http://localhost:8000/api/auth/refresh`

### Exemple minimal avec `curl`

```bash
# Générer un token CSRF stateless côté client
LOGIN_CSRF=$(php -r 'echo bin2hex(random_bytes(16));')

# Login
curl -i \
  -c cookiejar.txt \
  -H 'Content-Type: application/json' \
  -H "csrf-token: $LOGIN_CSRF" \
  -d '{"email":"user@example.com","password":"Secret123!"}' \
  http://localhost:8000/api/auth/login

# Profil courant
curl -i -b cookiejar.txt http://localhost:8000/api/auth/me

# Refresh
curl -i -b cookiejar.txt -X POST http://localhost:8000/api/auth/refresh
```

---

## API & flux principaux

### Vue d’ensemble

| Méthode | Route                        | Description                               |
|--------:|------------------------------|-------------------------------------------|
|    POST | `/api/setup/admin`           | Créer l’admin initial                     |
|    POST | `/api/auth/login`            | Login (création cookies access + refresh) |
|     GET | `/api/auth/me`               | Utilisateur courant                       |
|    POST | `/api/auth/refresh`          | Refresh JWT via cookie `__Host-rt`        |
|    POST | `/api/auth/register`         | Inscription                               |
|    POST | `/api/auth/logout`           | Logout + invalidation tokens              |
|    POST | `/api/auth/password/forgot`  | Demande de reset (email)                  |
|    POST | `/api/auth/password/reset`   | Réinitialisation via token                |
|     GET | `/verify-email`              | Validation d’email via lien signé         |
|    POST | `/api/auth/invite`           | Inviter un utilisateur (admin)            |
|    POST | `/api/auth/invite/complete`  | Compléter une invitation                  |

### Setup initial – `POST /api/setup/admin`

* Disponible uniquement tant qu’aucun utilisateur n’existe.
* CSRF : `initial_admin`.
* Corps : `{ "email", "password", "displayName" }`
* Crée l’administrateur (`ROLE_ADMIN`) et débloque les autres flux.

### Login – `POST /api/auth/login`

* Corps :

  ```json
  { "email": "user@example.com", "password": "Secret123!" }
  ```
* CSRF : `authenticate`.
* Effets :

    * Création des cookies `__Secure-at` (access) et `__Host-rt` (refresh).
    * Réponse :

      ```json
      { "user": { ... }, "exp": 1700000000 }
      ```

### Me – `GET /api/auth/me`

* Requiert un JWT valide dans `__Secure-at`.
* Réponse : `{ "user": { id, email, roles, displayName } }`.

### Refresh – `POST /api/auth/refresh`

* Requiert uniquement le cookie `__Host-rt` valide.
* Pas de CSRF.
* Réponse : `{ "exp": 1700000000 }` + rotation des cookies.

### Logout – `POST /api/auth/logout`

* Auth + CSRF.
* Effets :

    * Blocklist de l’access token.
    * Suppression du refresh token.
    * Expiration des cookies.
* Réponse : `204 No Content`.

### Inscription – `POST /api/auth/register`

* CSRF requis.
* Corps : `{ "email", "password", "displayName" }`
* Réponse : `201 { "user": { ... } }`
* Envoie un email de vérification (`/verify-email`).

### Invitation administrateur – `POST /api/auth/invite`

- Accessible uniquement aux administrateurs (`ROLE_ADMIN`).
- CSRF requis.
- Corps :

  ```json
  { "email": "nouvel.utilisateur@entreprise.com" }
  ```

- Effets :
  - Crée (ou réutilise) un `User` non activé pour cet email (`isEmailVerified = false`, mot de passe aléatoire).
  - Crée ou remplace l’invitation `InviteUser` associée avec un nouveau token et une date d’expiration (7 jours).
  - Envoie un email d’invitation en réutilisant le template de bienvenue, avec un lien d’activation pointant vers `/invite/complete?token=...`.
- Réponse :

  ```json
  { "status": "INVITE_SENT" }
  ```

### Compléter une invitation – `POST /api/auth/invite/complete`

- Endpoint public (accessible via le lien d’invitation).
- CSRF requis.
- Corps :

  ```json
  {
    "token": "<token d'invitation>",
    "displayName": "Prénom Nom",
    "password": "Secret123!",
    "confirmPassword": "Secret123!"
  }
  ```

- Effets :
  - Valide le token d’invitation (non expiré, non déjà utilisé).
  - Applique les mêmes règles de validation que l’inscription (mot de passe, nom d’affichage).
  - Met à jour le `User` associé (displayName + mot de passe) et marque l’email comme vérifié.
  - Marque l’invitation comme acceptée.
- Réponse : `201 { "user": { ... } }`.

### Reset password

* `POST /api/auth/password/forgot`

    * CSRF requis.
    * Corps : `{ "email" }`
    * Réponse : `202 { "status": "OK" }` (pas de fuite sur l’existence du compte).

* `POST /api/auth/password/reset`

    * CSRF requis.
    * Corps : `{ "token", "password" }`
    * Réponse : `204` + invalidation des sessions de l’utilisateur.

---

## CSRF stateless

Ce projet utilise une protection **CSRF stateless** pour tous les endpoints sensibles (login, register, reset password, logout, setup admin, invitation) :

- Aucun token CSRF n’est stocké en session ni émis par le backend.
- Le backend vérifie simplement :
  - la présence d’un jeton aléatoire suffisamment long dans l’en-tête `csrf-token` ;
  - et une origine HTTP valide (en-tête `Origin` ou, à défaut, `Referer`) :
    - soit exactement la même origine que le service d’auth (UI intégrée) ;
    - soit une origine autorisée par `ALLOWED_ORIGINS` (SPA sur sous-domaine).

Conséquences :

- Il **n’existe plus d’endpoint** de type `GET /api/auth/csrf/{id}` : tous les secrets CSRF sont générés côté client.
- Les clients (UI Vue intégrée, SPA externes, SDKs) doivent :
  - générer un token aléatoire par requête sensible (par ex. via `crypto.getRandomValues` ou `random_bytes`) ;
  - l’envoyer dans l’en-tête `csrf-token` ;
  - laisser le navigateur gérer l’en-tête `Origin` (pour les frontends web).

Pour les SPA sur sous-domaines (ex. `app.example.com` → `auth.example.com`) :

- le header `csrf-token` + une origine autorisée via `ALLOWED_ORIGINS` (CORS) suffisent ;
- aucune synchronisation de cookies CSRF n’est requise entre les sous-domaines.

---

## Intégration front (SPA)

### Cookies

* Toujours activer `credentials: 'include'` côté client (`fetch`, Axios, Angular `HttpClient`, etc.), pour que les
  cookies soient envoyés et reçus.
* Côté navigateur, **aucune manipulation de token** :

    * pas de stockage dans `localStorage` ou `sessionStorage` ;
    * le serveur lit directement `__Secure-at`.

### CSRF

Les endpoints sensibles (`/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/invite`, etc.) doivent toujours recevoir un jeton **stateless** dans l’en-tête `csrf-token`. Reportez-vous à la section [CSRF stateless](#csrf-stateless) pour le protocole détaillé et un exemple de génération côté client.

### Refresh silencieux

* Appeler périodiquement `POST /api/auth/refresh` (avec `credentials: 'include'`) avant l’expiration (`exp`).
* Aucun CSRF requis sur ce endpoint.

---

## Configuration & déploiement

### `.env` & Docker

* Le `.env` racine fournit les valeurs par défaut (dev).
* `docker compose` lit automatiquement `.env`.
* Les valeurs peuvent être surchargées via l’environnement, par ex. :

```env
APP_ENV=prod
APP_SECRET=...
DATABASE_URL=mysql://user:pass@db-internal:3306/auth
JWT_SECRET=...

UI_THEME_COLOR=emerald
UI_ENABLED=1
REGISTRATION_ENABLED=1
FRONTEND_DEFAULT_REDIRECT=https://app.example.com/dashboard
FRONTEND_REDIRECT_ALLOWLIST=https://app.example.com,https://partners.example.com
```

### Variables clés

**Feature flags & UI**

* `UI_ENABLED` (bool) : activer l’UI (`/login`, `/register`, `/reset-password`).
* `REGISTRATION_ENABLED` (bool) : autoriser l’inscription UI/API.
* `UI_THEME_COLOR` : couleur Tailwind (`red`, `emerald`, `indigo`, …).
* `UI_THEME_MODE` : `light` / `dark`.
* `BRANDING_NAME` : nom affiché dans l’interface et les emails.

**JWT & cookies**

* `JWT_ALGORITHM`, `JWT_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`.
* `ACCESS_COOKIE_*` : config du cookie `__Secure-at`.
* Cookie `__Host-rt` : configuré dans `config/packages/gesdinet_jwt_refresh_token.yaml`.

**Redirections**

* `FRONTEND_REDIRECT_ALLOWLIST` : liste d’origines autorisées (séparées par virgules).
* `FRONTEND_DEFAULT_REDIRECT` : URL de fallback si `redirect_uri` est absente ou non autorisée.

**CORS**

* `ALLOWED_ORIGINS` : regex unique, ex :

  ```text
  ^https?://(app\.example\.com|localhost)(:[0-9]+)?$
  ```

**Politique de mot de passe**

* La robustesse des mots de passe est vérifiée via la contrainte Symfony `PasswordStrength`.
* Le niveau minimal requis est piloté par la variable d’environnement :
  * `PASSWORD_STRENGTH_LEVEL` : entier de `1` (faible) à `4` (très fort), valeur par défaut `2` (niveau moyen).

**Rate limiting**

* `RATE_LOGIN_LIMIT`, `RATE_LOGIN_INTERVAL`.
* `RATE_FORGOT_LIMIT`, `RATE_FORGOT_INTERVAL` (réservés pour une configuration fine du rate limiting sur le reset password, non utilisés dans la configuration actuelle).

### Emails transactionnels (Notifuse)

* Emails de bienvenue et de reset envoyés via Notifuse :

    * `NOTIFUSE_API_BASE_URL`
    * `NOTIFUSE_WORKSPACE_ID`
    * `NOTIFUSE_API_KEY`
    * `NOTIFUSE_TEMPLATE_WELCOME`
    * (d’autres variables telles que `NOTIFUSE_NOTIFICATION_CENTER_URL` ou `NOTIFUSE_TEMPLATE_RESET_PASSWORD` peuvent être utilisées selon votre configuration Notifuse, mais ne sont pas consommées directement par ce projet).
* Placeholders typiques côté Notifuse :

    * `user_name`, `user_email`, `login_url`, `reset_url`, `reset_token`, `ttl_minutes`, `locale`, `brand_name`.

---

## Tests & SDKs

### Tests end-to-end – `tests/e2e.sh`

Un script Bash est fourni pour tester rapidement les principaux parcours (setup initial, login/logout, inscription + vérification d’email, reset password, invitation) :

```bash
./tests/e2e.sh
```

- Le script est interactif : il te demande la base URL, les emails/mots de passe à utiliser pour l’admin, l’utilisateur d’inscription et l’utilisateur invité.
- À chaque étape nécessitant une action sur l’email (clic sur `/verify-email`, `/reset-password/reset/...`, `/invite/complete?...`), il affiche un message du type :
  - `Attente de confirmation d’email… Ouvrez Maildev/Notifuse et cliquez sur le lien`, puis attend `ENTER`.
- Il utilise la même mécanique CSRF stateless que le reste du projet (`csrf-token` + cookies).

### Client JS – `@obsidiane/auth-sdk`

* Consomme l’API (login, me, refresh, logout, register, reset password) depuis navigateur ou Node/SSR.
* Sources & doc : `packages/auth-client-js`.

### Bundle PHP – `obsidiane/auth-sdk`

* Client HTTP Symfony pour ce service d’authentification.
* Sources & doc : `packages/auth-client-php`.

---

## Notes de sécurité

* Toujours déployer derrière **HTTPS** avec cookies `Secure`.
* Adapter `SameSite` selon l’architecture (monolithe, sous-domaines, front séparé).
* Configurer le rate limiting en fonction de votre exposition publique.
* Ne jamais exposer les tokens dans le JS côté client (pas de `localStorage`).
* Ajouter des en-têtes de sécurité côté reverse-proxy (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, etc.).

---

## Contribuer

Les contributions sont les bienvenues ❤️

1. Ouvrez une issue pour décrire un bug ou une feature.
2. Forkez le dépôt.
3. Ouvrez une PR avec :

    * les tests adaptés,
    * une mise à jour de la doc si nécessaire.

---

## Licence

Ce projet est distribué sous les termes de la licence indiquée dans [`LICENSE`](./LICENSE).
