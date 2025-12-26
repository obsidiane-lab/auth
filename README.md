# Obsidiane Auth

Service d’authentification **stateless** pour applications web & SPA, basé sur **Lexik JWT (HS256)** et **Gesdinet
Refresh Tokens**.  
Il fournit un login centré **cookies HttpOnly** (`__Secure-at` / `__Host-rt`), des endpoints API simples et une
protection **CSRF stateless** (Symfony).

> UI Angular (dossier `/webfront`), tokens en cookies sécurisés, refresh rotatif, vérification d’email.

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
- [Bridge Meridiane](#bridge-meridiane)
- [Notes de sécurité](#notes-de-sécurité)
- [Contribuer](#contribuer)
- [Licence](#licence)

---

## Vue d’ensemble

- Service d’auth centré **cookies HttpOnly** : access token JWT (`__Secure-at`) + refresh opaque (`__Host-rt`).
- Deux usages possibles :
  - UI Angular : `/login`, `/register`, `/reset-password`, `/reset-password/confirm`, `/verify-email`, `/invite/complete`, `/setup`.
  - API JSON : `/api/auth/...` pour front SPA, mobile, backends.
- Sécurité intégrée : CSRF stateless (`csrf-token`), vérification d’email, rate limiting, redirections allowlistées.
- Au premier démarrage, si aucun user n’existe, tout redirige vers `/setup` pour créer l’admin.
- Interface et emails uniquement **en français**.

---

## Fonctionnalités

- **UI Angular**
  - `/login`, `/register`, `/reset-password`, `/reset-password/confirm`.
  - `/setup` pour créer l’admin initial.
  - `/invite/complete` pour finaliser une invitation.
  - `/verify-email` pour la vérification d’email (appelle l’API).

- **API JSON principale**
  - Auth : `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/refresh`, `POST /api/auth/logout`.
  - Inscription & mot de passe : `POST /api/auth/register`, `/api/auth/password/forgot`, `/api/auth/password/reset`.
  - Invitation : `POST /api/auth/invite`, `POST /api/auth/invite/complete`.
  - Setup : `POST /api/setup/admin`.

- **Cookies & tokens**
  - `__Secure-at` : access token JWT (HttpOnly).
  - `__Host-rt` : refresh token opaque, single-use (HttpOnly).
  - CSRF stateless : token aléatoire côté client dans l’en-tête `csrf-token` pour chaque requête sensible.

---

## Architecture

- **Access token (JWT)**
  - Claims standard (`iss`, `aud`, `sub`, `iat`, `nbf`, `exp`, `jti`).
  - Stocké en cookie HttpOnly `__Secure-at`.

- **Refresh token (opaque)**
  - Stocké en base + cookie HttpOnly `__Host-rt` (host-only, single-use).

- **CSRF stateless**
  - Token aléatoire dans `csrf-token` + contrôle `Origin`/`Referer`.

- **Vérification d’email**
  - L’inscription envoie un lien vers `/verify-email?...` (front), qui appelle `/api/auth/verify-email`.
  - Tant que l’email n’est pas confirmé, le login est refusé (`EMAIL_NOT_VERIFIED`).

---

## Démarrage rapide

Par défaut, `docker compose` expose une entrée unique sur `http://localhost:8000` (Caddy dans le core).
`/api` est routé vers Symfony, le reste vers le webfront (Angular via `ng serve`).

La documentation OpenAPI générée par API Platform est disponible sur `http://localhost:8000/api/docs`.

### Installation

```bash
# Dépendances PHP
composer install

# Démarrer le core (racine)
docker compose up -d

# Installer les dépendances du webfront (premier lancement)
docker compose run --rm webfront npm install

# Lancer le webfront (si besoin)
docker compose up -d webfront

# Migrations
php bin/console doctrine:migrations:migrate
````

### URLs utiles (dev)

* UI Angular :

    * `http://localhost:8000/login`
    * `http://localhost:8000/register`
    * `http://localhost:8000/reset-password`
    * `http://localhost:8000/reset-password/confirm?token=...`
    * `http://localhost:8000/verify-email?...`
    * `http://localhost:8000/invite/complete?token=...`
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

| Méthode | Route                       | Description                               |
|--------:|-----------------------------|-------------------------------------------|
|    POST | `/api/setup/admin`          | Créer l’admin initial                     |
|    POST | `/api/auth/login`           | Login (cookies access + refresh)          |
|     GET | `/api/auth/me`              | Utilisateur courant                       |
|    POST | `/api/auth/refresh`         | Refresh JWT via cookie `__Host-rt`        |
|    POST | `/api/auth/register`        | Inscription                               |
|    POST | `/api/auth/logout`          | Logout + invalidation tokens              |
|    POST | `/api/auth/password/forgot` | Demande de reset (email)                  |
|    POST | `/api/auth/password/reset`  | Réinitialisation via token                |
|     GET | `/api/auth/verify-email`    | Validation d’email via lien signé         |
|    POST | `/api/auth/invite`          | Inviter un utilisateur (admin)            |
|    POST | `/api/auth/invite/complete` | Compléter une invitation                  |

Les payloads détaillés, codes de réponse et schémas sont disponibles dans `http://<AUTH_HOST>/api/docs` (OpenAPI).

---

## CSRF stateless

Tous les endpoints sensibles (login, register, reset, logout, setup, invitation) utilisent une protection **CSRF stateless** :

- Aucun token CSRF n’est stocké côté serveur.
- Le client génère un token aléatoire par requête et le met dans l’en-tête `csrf-token`.
- Le backend contrôle également l’origine (`Origin` ou `Referer`) via `ALLOWED_ORIGINS`.

Pour les SPA sur un autre domaine (ex. `app.example.com` → `auth.example.com`) :

- la combinaison `csrf-token` + CORS (`ALLOWED_ORIGINS`) suffit, sans cookie CSRF ni endpoint dédié.

---

## Intégration front (SPA)

### Cookies

* Toujours activer `credentials: 'include'` côté client (`fetch`, Axios, Angular `HttpClient`, …).
* Côté navigateur, **aucun stockage manuel de token** :
  * pas de `localStorage` / `sessionStorage` ;
  * le serveur lit directement le cookie `__Secure-at`.

### CSRF

Les endpoints sensibles (`/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/invite`, etc.) doivent toujours recevoir un jeton **stateless** dans l’en-tête `csrf-token`. Reportez-vous à la section [CSRF stateless](#csrf-stateless) pour le protocole détaillé et un exemple de génération côté client.

### Refresh silencieux

* Appeler régulièrement `POST /api/auth/refresh` (avec `credentials: 'include'`) avant l’expiration (`exp`).
* Aucun CSRF n’est requis sur ce endpoint.

---

## Configuration & déploiement

### `.env` & Docker

* Le `.env` racine fournit désormais des valeurs par défaut **orientées production** (domaine `example.com`, cookies sécurisés, SameSite `lax`). Ne mets aucun secret sensible dans ce fichier versionné.
* Pour un usage local, crée un `.env.local` ou charge `.env.dev` (APP_ENV=dev, CORS localhost, cookies non Secure, DB `database:3306`, mot de passe niveau 1).
* `docker compose` lit automatiquement `.env` ; toute variable peut être surchargée par l’environnement du runtime/compose.
* L’entrypoint génère `APP_SECRET` et `JWT_SECRET` si absents, mais ces valeurs tournent à chaque redémarrage : renseigne-les pour un déploiement réel.

### Variables d’environnement importantes

Les variables ci-dessous couvrent 95 % des cas. Copie/colle ce bloc puis adapte-le à ton infra.

Variables **critiques** vérifiées au démarrage (entrypoint) : `DATABASE_URL`, `APP_BASE_DOMAIN`, `NOTIFUSE_API_BASE_URL`, `NOTIFUSE_WORKSPACE_ID`, `NOTIFUSE_API_KEY`, `NOTIFUSE_TEMPLATE_WELCOME`, `NOTIFUSE_TEMPLATE_RESET_PASSWORD`. `APP_SECRET` et `JWT_SECRET` doivent aussi être fournis (sinon l’entrypoint en génère à chaque start, ce qui invalide les tokens).

**Bloc prêt à copier-coller (prod typique)**

```env
APP_BASE_DOMAIN=example.com
AUTH_HOST=auth.${APP_BASE_DOMAIN}
APP_DEFAULT_URI=https://${AUTH_HOST}

APP_SECRET=change-me
JWT_SECRET=change-me-too
DATABASE_URL="mysql://app:!ChangeMe!@database:3306/app?serverVersion=10.11.2-MariaDB&charset=utf8mb4"

JWT_ISSUER=https://${AUTH_HOST}
JWT_AUDIENCE=core-api
JWT_ACCESS_TTL=600
JWT_REFRESH_TTL=2592000
ALLOWED_ORIGINS="^https?://([a-zA-Z0-9-]+\\.)?${APP_BASE_DOMAIN}(:[0-9]+)?$"

ACCESS_COOKIE_DOMAIN=".${APP_BASE_DOMAIN}"
FRONTEND_DEFAULT_REDIRECT=https://app.${APP_BASE_DOMAIN}/
FRONTEND_REDIRECT_ALLOWLIST=https://app.${APP_BASE_DOMAIN}/,https://partners.${APP_BASE_DOMAIN}/
FRONTEND_BASE_URL=${APP_DEFAULT_URI}

REGISTRATION_ENABLED=1
PASSWORD_STRENGTH_LEVEL=2
API_DOCS_ENABLED=0

NOTIFUSE_API_BASE_URL=https://notifuse.example.com
NOTIFUSE_WORKSPACE_ID=prod-workspace
NOTIFUSE_API_KEY=change-me
NOTIFUSE_TEMPLATE_WELCOME=welcome
NOTIFUSE_TEMPLATE_RESET_PASSWORD=resetpass
```
  
Variables complémentaires (généralement à garder telles quelles) :

- `JWT_ALGORITHM` (HS256), `JWT_AUDIENCE`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`
- `ACCESS_COOKIE_NAME`, `ACCESS_COOKIE_PATH`, `ACCESS_COOKIE_SAMESITE`, `ACCESS_COOKIE_SECURE`
- `BRANDING_NAME`, `FRONTEND_BASE_URL`, `API_DOCS_ENABLED`
- Rate limiting : `RATE_LOGIN_LIMIT`, `RATE_LOGIN_INTERVAL`, `RATE_LOGIN_GLOBAL_LIMIT`

---

## Tests & SDKs

### Tests end-to-end – `tests/e2e.sh`

Un script Bash est fourni pour tester rapidement les principaux parcours (setup initial, login/logout, inscription + vérification d’email, reset password, invitation) :

```bash
./tests/e2e.sh
```

- Le script est interactif : il te demande la base URL, les emails/mots de passe à utiliser pour l’admin, l’utilisateur d’inscription et l’utilisateur invité.
- À chaque étape nécessitant une action sur l’email (clic sur `/verify-email?...`, `/reset-password/confirm?token=...`, `/invite/complete?...`), il affiche un message du type :
  - `Attente de confirmation d’email… Ouvrez Maildev/Notifuse et cliquez sur le lien`, puis attend `ENTER`.
- Il utilise la même mécanique CSRF stateless que le reste du projet (`csrf-token` + cookies).

### Client JS – `@obsidiane/auth-sdk`

* Consomme l’API (login, me, refresh, logout, register, reset password) depuis navigateur ou Node/SSR.
* Sources & doc : `packages/auth-client-js`.

### Bundle PHP – `obsidiane/auth-sdk`

* Client HTTP Symfony pour ce service d’authentification.
* Sources & doc : `packages/auth-client-php`.

---

## Bridge Meridiane

Un bridge Angular peut être généré depuis la spec OpenAPI (API Platform) via le Makefile racine :

```bash
make bridge
```

La documentation d’usage et les bonnes pratiques frontend sont dans `docs/meridiane.md`.

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
