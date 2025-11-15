# Obsidiane Auth – Auth Module

Service d’authentification complet (UI Twig/Vue + API JSON) basé sur Lexik JWT (HS256) et Gesdinet Refresh Tokens. Il fournit un login centré cookies (`__Secure-at` / `__Host-rt`), des endpoints API simples et une protection CSRF stateless.

## 1. Fonctionnalités

- UI intégrée (Twig + Vue):
  - Connexion: `GET /login`
  - Inscription: `GET /register`
  - Réinitialisation du mot de passe: `GET /reset-password` (+ `check-email` et `reset/{token}`)
- API JSON:
  - `POST /api/login` – authentification
  - `GET /api/auth/me` – utilisateur courant
  - `POST /api/auth/register` – inscription
  - `POST /api/auth/logout` – logout (invalidation des tokens + cookies)
  - `POST /api/token/refresh` – rafraîchissement d’access token
  - `GET /api/auth/csrf/{id}` – récupération des jetons CSRF
- Sessions:
  - Access token court en cookie sécurisé `__Secure-at`
  - Refresh token rotatif en cookie `__Host-rt` (single‑use, stocké en base)
- Sécurité:
  - CSRF stateless via en‑tête `X-CSRF-TOKEN` (ids: `authenticate`, `register`, `password_request`, `password_reset`, `logout`)
  - Throttling de login via rate limiter Symfony
  - Anti‑rejeu des refresh tokens
  - Vérification d’email via VerifyEmailBundle + lien signé (connexion bloquée tant que l’adresse n’est pas confirmée)

L’interface et les emails sont fournis en français.

## 2. Démarrage rapide (développement)

Par défaut, le `docker compose` expose le service sur `http://localhost:8000`.

```bash
composer install
docker compose up -d
php bin/console doctrine:migrations:migrate
```

UI:

- Login: `http://localhost:8000/login`
- Inscription: `http://localhost:8000/register`
- Reset password: `http://localhost:8000/reset-password`
- Première exécution (aucun utilisateur en base) : `http://localhost:8000/setup` propose un formulaire dédié pour créer l’administrateur initial (`ROLE_ADMIN`). Tant que ce compte n’existe pas, le module redirige toutes les pages publiques vers cette interface.
- Après chaque inscription, un email de bienvenue contient un lien signé `/verify-email`. Tant que l’adresse n’est pas confirmée, les tentatives de connexion retournent `EMAIL_NOT_VERIFIED`.

API (exemples avec `curl`):

```bash
# Récupérer un token CSRF pour le login
LOGIN_CSRF=$(curl -s http://localhost:8000/api/auth/csrf/authenticate | jq -r '.token')

# 1) Login
curl -i \
  -c cookiejar.txt \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-TOKEN: $LOGIN_CSRF" \
  -d '{"email":"user@example.com","password":"Secret123!"}' \
  http://localhost:8000/api/login

# 2) Profil courant
curl -i -b cookiejar.txt http://localhost:8000/api/auth/me

# 3) Refresh
curl -i -b cookiejar.txt -X POST http://localhost:8000/api/token/refresh

# 4) Logout
LOGOUT_CSRF=$(curl -s http://localhost:8000/api/auth/csrf/logout | jq -r '.token')
curl -i \
  -b cookiejar.txt \
  -H "X-CSRF-TOKEN: $LOGOUT_CSRF" \
  -X POST \
  http://localhost:8000/api/auth/logout
```

## 3. Parcours UI

- **Connexion (`GET /login`)**
  - Charge la page Vue `SignIn` via `templates/auth/login.html.twig`.
  - Le backend injecte les props (endpoints, `redirectTarget`, `featureFlags`, `csrf.authenticate`).
  - Le formulaire envoie `POST /api/login` avec `X-CSRF-TOKEN: csrf.authenticate`. En cas de succès, redirection vers une URL validée par la politique de redirection.

- **Inscription (`GET /register`)**
  - Charge la page Vue `SignUp`.
  - Utilise `POST /api/auth/register` avec `X-CSRF-TOKEN: csrf.register`.
  - En cas de succès, affiche un message invitant à consulter l’email de confirmation puis renvoie vers `/login`. La connexion reste impossible tant que l’adresse n’a pas été validée via le lien reçu.
  - Peut être désactivée via la feature flag `REGISTRATION_ENABLED`.

- **Réinitialisation du mot de passe**
  - `GET /reset-password` intègre `ForgotPassword` (saisie d’email).
  - `POST /reset-password` attend `{ email }` + CSRF `password_request`, renvoie toujours 202 (`{ status: 'OK' }`).
  - L’utilisateur reçoit un lien signé `/reset-password/reset/{token}`.
  - `GET /reset-password/reset/{token}` monte `ResetPasswordPage`, `POST /reset-password/reset` attend `{ token, password }` + CSRF `password_reset` et renvoie 204.

Pour compatibilité, l’URL racine `/` accepte aussi un paramètre `view=login|register|forgot|reset` et redirige vers la page adéquate.

## 4. Endpoints API d’authentification

- `POST /api/login`
  - Corps: `{ "email": string, "password": string }`
  - CSRF requis: `authenticate` (en‑tête `X-CSRF-TOKEN`)
  - Réponse 200: `{ user: { id, email, roles, displayName }, exp }`
  - Effets: création de `__Secure-at` (access) et `__Host-rt` (refresh).

- `GET /api/auth/me`
  - Nécessite un JWT valide en cookie `__Secure-at`.
  - Réponse 200: `{ user: { id, email, roles, displayName } }`

- `POST /api/token/refresh`
  - Nécessite un cookie `__Host-rt` valide.
  - Pas de CSRF.
  - Réponse 200: `{ exp }` + rotation des cookies `__Secure-at` / `__Host-rt`.

- `POST /api/auth/register`
  - CSRF requis: `register`.
  - Corps: `{ "email": string, "password": string, "displayName": string }`
  - Réponse 201: `{ user: { ... } }`

- `POST /api/auth/logout`
  - Authentification requise + CSRF `logout`.
  - Réponse 204, blocklist de l’access token et suppression du refresh token.

- `POST /api/setup/admin`
  - Disponible uniquement tant qu’aucun utilisateur n’existe.
  - CSRF requis: `initial_admin`.
  - Crée le compte administrateur initial (`ROLE_ADMIN`).

- `GET /api/auth/csrf/{id}`
  - Public, stateless.
  - `id` ∈ `authenticate`, `register`, `password_request`, `password_reset`, `logout`.
  - Réponse 200: `{ token_id, token }`.

- `GET /verify-email`
  - Route publique empruntée par les liens de confirmation envoyés aux nouveaux utilisateurs.
  - Paramètres: `id` (identifiant utilisateur) + signature générée par VerifyEmailBundle.
  - Redirige vers `/login` avec un message (`flash`) de succès ou d’échec.

## 5. Cookies & CSRF

- **Cookies**
  - `__Secure-at`: access token JWT, HttpOnly, utilisé pour authentifier les appels API.
  - `__Host-rt`: refresh token opaque, HttpOnly, single‑use, sert uniquement à obtenir un nouveau `__Secure-at`.
  - Les noms, domaines, SameSite et Secure sont configurables via les variables `ACCESS_COOKIE_*` et la config Gesdinet (voir `docs/CONFIGURATION.md`).

- **CSRF stateless**
  - Chaque action sensible possède un identifiant dans `CsrfTokenId` (`authenticate`, `register`, `password_request`, `password_reset`, `logout`, `initial_admin`).
  - L’UI reçoit directement les tokens dans `props.csrf`.
  - Les clients externes (SPA, SDK, CLI) récupèrent les tokens via `GET /api/auth/csrf/{id}` et les renvoient dans `X-CSRF-TOKEN`.

## 6. Configuration fonctionnelle

Variables les plus importantes côté usage:

- `UI_ENABLED`: active ou non les pages UI (`/login`, `/register`, `/reset-password`).
- `REGISTRATION_ENABLED`: autorise l’inscription via UI/API.
- `UI_THEME_COLOR`: couleur Tailwind par défaut (ex. `emerald`, `indigo`).
- `UI_THEME_MODE`: `light` ou `dark`, appliqué au rendu serveur.
- `BRANDING_NAME`: nom affiché dans l’interface et les emails.
- `FRONTEND_REDIRECT_ALLOWLIST`: liste d’origines autorisées pour `redirect_uri`.
- `FRONTEND_DEFAULT_REDIRECT`: URL utilisée si `redirect_uri` est absente ou non autorisée.

Les détails (CORS, rate limiting, cookies, Notifuse, etc.) sont décrits dans `docs/CONFIGURATION.md`.

## 7. SDKs

- **Client JS** – `@obsidiane/auth`
  - Permet de consommer l’API (login, me, refresh, logout, register, reset password) depuis un navigateur ou un environnement Node/SSR.
  - Sources et documentation: `packages/auth-client-js`.

- **Bundle PHP** – `obsidiane/auth-bundle`
  - Fournit un client HTTP Symfony pour interagir avec ce service d’authentification.
  - Sources et documentation: `packages/auth-client-php`.

Les SDKs encapsulent les endpoints décrits ci‑dessus. Reportez‑vous à `docs/USER_GUIDE.md` pour un guide d’usage complet (cookies, CSRF, intégration SPA).
