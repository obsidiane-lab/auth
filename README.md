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
    - API : endpoints sous `/api/auth/...` + `/api/token/refresh` pour front SPA/mobile.
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
    - `POST /api/login`
    - `GET /api/auth/me`
    - `POST /api/auth/register`
    - `POST /api/auth/logout`
    - `POST /api/token/refresh`
    - `POST /reset-password`
    - `POST /reset-password/reset`
    - `POST /api/auth/invite` – Inviter un utilisateur (admin uniquement).
    - `POST /api/auth/invite/complete` – Compléter une invitation (définir profil + mot de passe).

- **Cookies & tokens**
    - `__Secure-at` : access token JWT (HttpOnly).
    - `__Host-rt` : refresh token opaque, single-use (HttpOnly).
    - CSRF stateless : jetons par opération (`authenticate`, `register`, `password_request`, `password_reset`, `logout`,
      `initial_admin`, `invite_user`, `invite_complete`).

---

## Architecture

- **Access token (JWT)**
    - Claims standard (`iss`, `aud`, `sub`, `iat`, `nbf`, `exp`, `jti`).
    - Stocké dans le cookie `__Secure-at` (HttpOnly, SameSite configurable).
    - Utilisé pour authentifier les appels API (pas besoin d’`Authorization: Bearer` côté navigateur).

- **Refresh token (opaque)**
    - Persisté en base, associé à l’utilisateur.
    - Stocké en cookie `__Host-rt` (HttpOnly, host-only, `SameSite=strict`).
    - Rotatif : à chaque `POST /api/token/refresh`, l’ancien est invalidé.

- **CSRF stateless**
    - Protection basée sur `Origin`/`Referer` + jetons générés côté client.
    - UI & SPA : génèrent un token aléatoire par requête et l’envoient dans l’en-tête `csrf-token` (et, pour les apps web, via un cookie `csrf-token_<token>` / `__Host-csrf-token_<token>`).

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

    * `http://localhost:8000/api/login`
    * `http://localhost:8000/api/auth/me`
    * `http://localhost:8000/api/token/refresh`

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
  http://localhost:8000/api/login

# Profil courant
curl -i -b cookiejar.txt http://localhost:8000/api/auth/me

# Refresh
curl -i -b cookiejar.txt -X POST http://localhost:8000/api/token/refresh
```

---

## API & flux principaux

### Vue d’ensemble

| Méthode | Route                   | Description                               |
|--------:|-------------------------|-------------------------------------------|
|    POST | `/api/setup/admin`      | Créer l’admin initial                     |
|    POST | `/api/login`            | Login (création cookies access + refresh) |
|     GET | `/api/auth/me`          | Utilisateur courant                       |
|    POST | `/api/token/refresh`    | Refresh JWT via cookie `__Host-rt`        |
|    POST | `/api/auth/register`    | Inscription                               |
|    POST | `/api/auth/logout`      | Logout + invalidation tokens              |
|    POST | `/reset-password`       | Demande de reset (email)                  |
|    POST | `/reset-password/reset` | Réinitialisation via token                |
|     GET | `/verify-email`         | Validation d’email via lien signé         |
|    POST | `/api/auth/invite`      | Inviter un utilisateur (admin)            |
|    POST | `/api/auth/invite/complete` | Compléter une invitation                |

### Setup initial – `POST /api/setup/admin`

* Disponible uniquement tant qu’aucun utilisateur n’existe.
* CSRF : `initial_admin`.
* Corps : `{ "email", "password", "displayName" }`
* Crée l’administrateur (`ROLE_ADMIN`) et débloque les autres flux.

### Login – `POST /api/login`

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

### Refresh – `POST /api/token/refresh`

* Requiert uniquement le cookie `__Host-rt` valide.
* Pas de CSRF.
* Réponse : `{ "exp": 1700000000 }` + rotation des cookies.

### Logout – `POST /api/auth/logout`

* Auth + CSRF `logout`.
* Effets :

    * Blocklist de l’access token.
    * Suppression du refresh token.
    * Expiration des cookies.
* Réponse : `204 No Content`.

### Inscription – `POST /api/auth/register`

* CSRF : `register`.
* Corps : `{ "email", "password", "displayName" }`
* Réponse : `201 { "user": { ... } }`
* Envoie un email de vérification (`/verify-email`).

### Invitation administrateur – `POST /api/auth/invite`

- Accessible uniquement aux administrateurs (`ROLE_ADMIN`).
- CSRF : `invite_user`.
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
- CSRF : `invite_complete`.
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

* `POST /reset-password`

    * CSRF : `password_request`.
    * Corps : `{ "email" }`
    * Réponse : `202 { "status": "OK" }` (pas de fuite sur l’existence du compte).

* `POST /reset-password/reset`

    * CSRF : `password_reset`.
    * Corps : `{ "token", "password" }`
    * Réponse : `204` + invalidation des sessions de l’utilisateur.

---

## CSRF stateless (Symfony 7.2+)

Ce projet utilise la protection **CSRF stateless** introduite dans Symfony 7.2 pour tous les endpoints sensibles (`authenticate`, `register`, `password_request`, `password_reset`, `logout`, `initial_admin`, `invite_user`, `invite_complete`) :

- Aucun token CSRF n’est stocké en session.
- Symfony s’appuie sur :
  - les en-têtes `Origin` / `Referer` (même origine que le service d’auth) ;
  - et, lorsque disponible, un jeton généré côté client envoyé dans le header `csrf-token`
    (+ cookie `csrf-token_<token>` / `__Host-csrf-token_<token>` pour les apps web sur le même domaine).
- Le backend utilise `SameOriginCsrfTokenManager` pour valider ces tokens (Origin + double-soumission).

Conséquences :

- Il **n’existe plus d’endpoint** de type `GET /api/auth/csrf/{id}` : les secrets sont générés côté client.
- Les clients (UI Vue intégrée, SPA externes, SDKs) doivent :
  - générer un token aléatoire par opération (par ex. via `crypto.getRandomValues`) ;
  - l’envoyer dans l’en-tête `csrf-token` ;
  - (optionnel, mais recommandé pour les apps web) écrire un cookie `csrf-token_<token>=csrf-token`
    ou `__Host-csrf-token_<token>` en HTTPS.

Pour les SPA sur sous-domaines :

- Le header `csrf-token` suffit en pratique (le cookie double-submit ne peut pas toujours être partagé selon le domaine).
- Vérifiez la configuration `trusted_proxies` / `X-Forwarded-*` pour que Symfony puisse déterminer correctement l’origine.

Le code Vue de ce projet (login, register, reset, invite, setup) implémente déjà ce protocole : chaque requête protégée porte automatiquement un header `csrf-token` et un cookie de double-soumission, sans interaction avec le backend pour “récupérer” un token.

---

## Intégration front (SPA)

### Cookies

* Toujours activer `credentials: 'include'` côté client (`fetch`, Axios, Angular `HttpClient`, etc.), pour que les
  cookies soient envoyés et reçus.
* Côté navigateur, **aucune manipulation de token** :

    * pas de stockage dans `localStorage` ou `sessionStorage` ;
    * le serveur lit directement `__Secure-at`.

### CSRF

Les endpoints sensibles (`/api/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/invite`, etc.) doivent toujours recevoir un jeton **stateless** dans l’en-tête `csrf-token`. Reportez-vous à la section [CSRF stateless (Symfony 7.2+)](#csrf-stateless-symfony72) pour le protocole détaillé et un exemple de génération côté client.

### Refresh silencieux

* Appeler périodiquement `POST /api/token/refresh` (avec `credentials: 'include'`) avant l’expiration (`exp`).
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

**Rate limiting**

* `RATE_LOGIN_LIMIT`, `RATE_LOGIN_INTERVAL`.
* `RATE_FORGOT_LIMIT`, `RATE_FORGOT_INTERVAL`.

### Emails transactionnels (Notifuse)

* Emails de bienvenue et de reset envoyés via Notifuse :

    * `NOTIFUSE_API_BASE_URL`
    * `NOTIFUSE_NOTIFICATION_CENTER_URL`
    * `NOTIFUSE_WORKSPACE_ID`
    * `NOTIFUSE_API_KEY`
    * `NOTIFUSE_TEMPLATE_WELCOME`
    * `NOTIFUSE_TEMPLATE_RESET_PASSWORD`
* Placeholders fournis :

    * `user_name`, `user_email`, `login_url`, `reset_url`, `reset_token`, `ttl_minutes`, `locale`, `brand_name`.

---

## SDKs

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
