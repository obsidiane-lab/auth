# Guide Utilisateur – Obsidiane Auth

Ce document explique comment utiliser le service d’authentification (UI + API), les cookies et tokens émis, les en-têtes attendus, la sécurité et les bonnes pratiques d’intégration côté front.

---

## 1. Vue d’ensemble

- Authentification dual‑mode:
- UI: pages `/login`, `/register` et `/reset-password` (réinitialisation). Tant qu’aucun utilisateur n’est présent en base, ces pages redirigent automatiquement vers `/setup` pour créer l’administrateur initial (`ROLE_ADMIN`).
  - Lors de l’inscription, un email de confirmation est envoyé. L’utilisateur doit cliquer sur le lien signé `/verify-email` avant de pouvoir se connecter (`EMAIL_NOT_VERIFIED` sinon).
  - API: endpoints sous le préfixe `/api/auth/...` pour intégrations SPA/mobile.
- Sessions JWT courtes (access) + refresh tokens rotatifs (DB), anti‑rejeu.
- Cookies sécurisés (HttpOnly, SameSite paramétrable) + tokens CSRF stateless fournis par Symfony (`csrf_token($id)`) : chaque action `/api/auth/<operation>` dispose d’un identifiant (`authenticate`, `register`, `password_request`, `password_reset`, `logout`). Les tokens sont signés et limités à la méthode + route ; l’UI les reçoit via `props.csrf` et toute intégration peut les récupérer via `GET /api/auth/csrf/{id}` pour les renvoyer dans l’en-tête `X-CSRF-TOKEN`.
- Rate limiting sur login et forgot.
- L’appellation affichée dans les titres et les emails est pilotée par la variable d’environnement `BRANDING_NAME` (défaut `Obsidiane Auth`).
- Le mode (light/dark) est configuré par `UI_THEME_MODE` (défaut `dark`). Il est fixé par l’environnement et n’est pas modifiable par l’utilisateur (aucune persistance locale).
- Interface uniquement en français.

---

## 2. Glossaire rapide

- Access token (JWT): court‑terme, envoyé en cookie `__Secure-at` (HttpOnly, Domain partagé `.example.com`, SameSite `lax`), porte l’identité et les claims standards (iss, aud, sub, iat, nbf, exp, jti).
- Refresh token: opaque, stocké en base (single‑use), envoyé en cookie `__Host-rt` (HttpOnly, host-only sur AUTH, SameSite `strict`). Sert uniquement à obtenir un nouveau access token.
- CSRF token stateless: les actions critiques utilisent un unique identifiant (`authenticate`, `register`, `password_request`, `password_reset`, `logout`, `initial_admin`). L’endpoint `/api/auth/csrf/{id}` renvoie `csrf_token($id)` (Symfony) que l’UI embarque dans `props.csrf` et que toutes les intégrations (SPA, SDK, CLI) renvoient dans l’en-tête `X-CSRF-TOKEN`.

---

## 3. Endpoints API

Les principaux endpoints API sont accessibles sous `/api/auth` ; le flow de réinitialisation utilise les routes `/reset-password`.

### 3.0 POST `/api/setup/admin`

- Disponible uniquement tant qu’aucun utilisateur n’existe dans la base.
- CSRF requis: `initial_admin`.
- Corps: `{ "email", "password", "displayName" }`
- Réponse 201: `{ user: { id, email, displayName, roles: ["ROLE_ADMIN"] } }`
- Effets:
  - Crée l’administrateur initial (rôle admin explicite).
  - Les autres endpoints (register/login/reset) restent bloqués tant que ce bootstrap n’est pas réalisé.

### 3.1 POST `/api/login`

Ce point repose sur l’authenticator `json_login` du bundle Lexik.

- Corps: `{ "email": "user@example.com", "password": "Secret123!" }`
- Réponse 200: `{ user: { id, email, roles, displayName }, exp }`
- Effets:
  - `json_login` (Lexik) génère le JWT puis l’`AuthenticationSuccessEvent` pose les cookies `__Secure-at` (access) et `__Host-rt` (refresh, via Gesdinet).
  - Anti‑CSRF: exiger l’en‑tête `X-CSRF-TOKEN` contenant `csrf_token('authenticate')` (fourni par l’UI ou via `GET /api/auth/csrf/authenticate`).
- Erreurs possibles:
  - 400 `{ error: 'INVALID_PAYLOAD' }`
  - 401 `{ error: 'INVALID_CREDENTIALS' }`
  - 401 `{ error: 'EMAIL_NOT_VERIFIED' }` si l’utilisateur n’a pas encore confirmé son adresse.
  - 429 `{ error: 'RATE_LIMIT' }` (+ `Retry-After` si applicable)

Exemple:

```bash
LOGIN_CSRF=$(curl -s http://localhost/api/auth/csrf/authenticate | jq -r '.token')
curl -i \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-TOKEN: $LOGIN_CSRF" \
  -d '{"email":"user@example.com","password":"Secret123"}' \
  http://localhost/api/login
```

### 3.2 GET `/api/auth/me`

- Auth requis (cookie `__Secure-at`).
- Réponse 200: `{ user: { id, email, roles, displayName } }`
- Erreurs:
  - 401 si non authentifié

### 3.3 POST `/api/token/refresh`

- Géré par Gesdinet `refresh_jwt`: seul le cookie `__Host-rt` est requis (HttpOnly, single-use). Aucun CSRF.
- Réponse 200: `{ exp }` et rotation automatique des cookies `__Secure-at` / `__Host-rt`.
- Erreurs possibles: 401 si le cookie est absent/invalide, 429 si throttle.

Exemple:

```bash
curl -i \
  -b cookiejar.txt \
  -X POST \
  http://localhost/api/token/refresh
```

### 3.4 POST `/api/auth/logout`

- Auth requis + CSRF `logout` requis.
- Effets:
  - Ajoute l’access token courant en blocklist.
  - Supprime le refresh token en base.
  - Expire les cookies `__Secure-at` et `__Host-rt`.
- Réponse 204 (No Content)

### 3.5 POST `/api/auth/register`

- Selon configuration, peut être désactivé. CSRF `register` requis.
- Corps: `{ email, password, displayName }`
- Réponse 201: `{ user: { ... } }`
- Erreurs 422: `{ error: 'INVALID_REGISTRATION', details: { ... } }`
  - Codes possibles: `EMAIL_ALREADY_USED`, `INVALID_EMAIL`, `INVALID_PASSWORD`, `DISPLAY_NAME_REQUIRED`, etc.

### 3.6 POST `/reset-password`

- Corps: `{ email }` (CSRF `password_request` requis)
- Réponse 202: `{ status: 'OK' }` (pas de fuite d’existence de compte)
- Les erreurs côté serveur sont journalisées, mais jamais exposées.

### 3.7 POST `/reset-password/reset`

- Corps: `{ token, password }` (token reçu par email + CSRF `password_reset`)
- Réponse 204: mot de passe réinitialisé.
- Effets:
  - Invalidation de toutes les sessions (suppression refresh tokens de l’utilisateur).
- Erreurs 400: `{ error: 'INVALID_TOKEN' | 'EMPTY_PASSWORD' | 'INVALID_USER' }`

### 3.8 GET `/api/auth/csrf/{tokenId}`

- Public, stateless.
- Paramètre `tokenId` ∈ { `authenticate`, `register`, `password_request`, `password_reset`, `logout` }.
- Réponse 200: `{ token_id, token }`.
- À utiliser côté SPA/SDK pour récupérer dynamiquement le token à placer dans l’en-tête `X-CSRF-TOKEN`.

---

## 4. Cookies & sécurité

- `__Secure-at` (HttpOnly, Domain partagé `.example.com`, Path `/`, SameSite `lax`): access token court, non lisible par JS, utilisé par AUTH **et** les API SERVICE qui partagent le domaine.
- `__Host-rt` (HttpOnly, host-only, Path `/`, SameSite `strict`): refresh token opaque, single-use, rotation à chaque `/refresh`.
  - Rappel: `__Host-` impose `Secure=true`, path `/` et aucun domaine explicite (le navigateur force l’host courant).
- Cookies CSRF stateless: Symfony émet un cookie lisible `csrf-token` (non HttpOnly) synchronisé avec la fonction `csrf_token($id)`. Chaque identifiant (`authenticate`, `register`, `password_request`, `password_reset`, `logout`) est aussi disponible via `/api/auth/csrf/{id}`. Les clients renvoient simplement l’en-tête `X-CSRF-TOKEN`.

Notes:
- Le header `Authorization` Bearer n’est pas nécessaire côté navigateur: l’extraction côté serveur se fait via le cookie `__Secure-at`.
- Après `logout`, tous les cookies sont expirés, l’access token est mis en blocklist, et le refresh supprimé.

---

## 5. Anti‑CSRF – client

Chaque opération mutative (`authenticate`, `register`, `password_request`, `password_reset`, `logout`) attend un jeton CSRF header-only. Les tokens sont signés par Symfony, liés à la méthode et au chemin, et expirent au bout de quelques minutes.

### UI (pages Twig/Vue)

1. Les props envoyées par Symfony (`props.csrf`) contiennent déjà un token valide pour le formulaire en cours.
2. Le front stocke ce token en mémoire (ou dans un store léger) et l’ajoute dans l’en-tête `X-CSRF-TOKEN` via une couche réseau (Axios/fetch interceptor).
3. Si l’API répond `403 CSRF_TOKEN_INVALID`, on redemande le token (`GET /api/auth/csrf/{id}`) et on réessaie la requête une fois.

### API/SPA/SDK

1. Avant d’envoyer une requête `POST/PUT/PATCH/DELETE`, appelez `/api/auth/csrf/{id}` (avec `credentials: include`) pour récupérer le token (`csrf_token($id)`) géré par Symfony.
2. Ajoutez ce token dans l’en-tête `X-CSRF-TOKEN` le temps de la requête. Les identifiants disponibles sont `authenticate`, `register`, `password_request`, `password_reset`, `logout`.
3. Même logique de relecture : un 403 CSRF déclenche un nouvel appel au endpoint CSRF, puis un retry.

```ts
async function fetchCsrfToken(id: string) {
  const response = await fetch(`/api/auth/csrf/${id}`, { credentials: 'include' });
  const { token } = await response.json();
  return token;
}

async function callProtectedEndpoint() {
  const res = await fetch('/api/token/refresh', {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('refresh_failed');
  }
}
```

---

## 6. Rate limiting

- Par défaut (env):
- Login: `RATE_LOGIN_LIMIT=5` sur `RATE_LOGIN_INTERVAL="60 seconds"`.
- Forgot: `RATE_FORGOT_LIMIT=3` sur `RATE_FORGOT_INTERVAL`.
- Réponse 429 avec `{ error: 'RATE_LIMIT' }` et en‑tête `Retry-After` quand applicable.

---

## 7. Redirections & allowlist

- Paramètre optionnel `redirect_uri` (UI): la cible est validée par une allowlist d’origines (`FRONTEND_REDIRECT_ALLOWLIST`).
- L’allowlist compare schéma + host (+ port). Tous les chemins sous l’origine sont autorisés.
- Si non autorisée, redirection vers `FRONTEND_DEFAULT_REDIRECT`.

---

## 8. Internationalisation

- L’interface UI et les emails sont uniquement livrés en français.

---

## 9. Sécurité & autorisations

- Accès API:
- Public: `POST /api/login`, `POST /api/auth/register`, `POST /reset-password`, `POST /reset-password/reset`, `GET /api/auth/csrf/{id}`, `POST /api/token/refresh`, `POST /api/auth/logout`.
  - Tout le reste: authentifié (JWT en cookie `__Secure-at`).
- Accès User (API Platform):
  - `GET /api/users/me`: authentifié.
  - `GET /api/users` (collection): admin uniquement.
  - `GET /api/users/{id}`: propriétaire (current user) ou admin (via Voter `USER_READ`).
  - `DELETE /api/users/{id}`: admin.

---

## 10. Intégration SPA (ex: Angular)

- Toujours utiliser `credentials: 'include'` sur `fetch`/`HttpClient` pour envoyer/recevoir les cookies.
- Après login, l’UI peut rediriger vers la cible validée.
- Rafraîchissement silencieux: appeler `POST /api/token/refresh` périodiquement avant l’expiration d’`exp` (le cookie est envoyé automatiquement, pas de CSRF).
- Exemple Angular (HttpInterceptor, pseudo‑code):

```ts
intercept(req: HttpRequest<any>, next: HttpHandler) {
  if (req.method === 'GET' || !requiresCsrf(req.url)) {
    return next.handle(req);
  }

  const csrf = csrfStore.get(req.url); // à implémenter: GET /api/auth/csrf/<id>
  const headers = csrf ? req.headers.set('X-CSRF-TOKEN', csrf) : req.headers;
  const withCreds = req.clone({ headers, withCredentials: true });
  return next.handle(withCreds);
}
```

---

## 11. Configuration (extraits)

- JWT & tokens:
  - `JWT_ALGORITHM`, `JWT_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`.
- Cookies:
  - `ACCESS_COOKIE_*` (nom, domaine, path, SameSite, Secure) configurent `__Secure-at`. Le cookie refresh `__Host-rt` dépend de `config/packages/gesdinet_jwt_refresh_token.yaml` (paramètres `token_parameter_name` et bloc `cookie`).
- UI & thèmes:
  - `UI_ENABLED`, `REGISTRATION_ENABLED`, `UI_THEME_COLOR`, `UI_THEME_MODE` (pilotés par l’environnement, non modifiables par l’utilisateur).
- CSRF:
  - `config/packages/framework.yaml` (section `csrf_protection`: `stateless_token_ids`, `check_header`) + endpoint `GET /api/auth/csrf/{id}` pour les clients headless.
- Redirections:
  - `FRONTEND_REDIRECT_ALLOWLIST`, `FRONTEND_DEFAULT_REDIRECT`.
- CORS:
  - `ALLOWED_ORIGINS` (regex). Exemple: `^https?://(app\\.example\\.com|localhost)(:[0-9]+)?$`.
    - Toujours activer `credentials: 'include'` côté client et conserver `Secure=true` (avec `SameSite=lax` pour `__Secure-at`, `SameSite=strict` pour `__Host-rt`).
- Rate limiting:
  - `RATE_*_LIMIT`, `RATE_*_INTERVAL`.

---

## 12. FAQ & dépannage

- 401 sur `/api/auth/me` après login:
  - Vérifier que les cookies sont bien stockés (`curl -b` / devtools) et envoyés (`withCredentials: true`).
- 401 sur `/api/token/refresh`:
  - Vérifier que le cookie `__Host-rt` est encore présent (HttpOnly) et non expiré. Relancer un login si nécessaire.
- 429 (RATE_LIMIT):
  - Respecter le délai `Retry-After`. Ajuster la conf si nécessaire.
- Redirection non prise en compte:
  - Vérifier que `redirect_uri` appartient à une origine autorisée par `FRONTEND_REDIRECT_ALLOWLIST`.
- Emails non reçus:
  - Vérifier les connexions à l’instance Notifuse (`NOTIFUSE_API_BASE_URL`, `NOTIFUSE_WORKSPACE_ID`, `NOTIFUSE_API_KEY`) et que les bons templates sont configurés (`NOTIFUSE_TEMPLATE_WELCOME`, `NOTIFUSE_TEMPLATE_RESET_PASSWORD`). En dev, assurez-vous que l’instance est joignable et que les logs Notifuse ne remontent pas d’erreurs.

---

## 14. Politiques de mot de passe & vérification d'email

- Politique par défaut:
  - Longueur minimale: 8 caractères (validée côté serveur et UI).
  - Recommandé: intégrer un indicateur de force (ex: zxcvbn) et bannir des mots de passe communs.
- Vérification d’email (optionnelle):
  - En production, il est recommandé d’exiger la confirmation d’adresse avant d’autoriser la connexion, afin d’éviter les abus via la fonctionnalité de reset.
  - Implémentation suggérée: ajouter un champ `isVerified` à l’utilisateur, enregistrer une entité de validation avec un token temporel, et exiger `isVerified=true` lors du login.

---

## 15. En-têtes de sécurité (recommandations)

- CSP stricte (Content-Security-Policy) avec `default-src 'self'` et directives pour `img-src`, `style-src` (hashes ou nonce), `script-src` (nonce), `connect-src` (origines API).
- HSTS (Strict-Transport-Security) sur 6–12 mois avec `includeSubDomains; preload` si éligible.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: no-referrer` (ou `strict-origin-when-cross-origin`).
- `Permissions-Policy` pour désactiver les capteurs non nécessaires.
- `X-Frame-Options: SAMEORIGIN` (ou `frame-ancestors` via CSP).

Voir `infra/frankenphp/Caddyfile` pour ajouter ces en-têtes côté reverse‑proxy.

---

## 13. Annexes

- UI: `/login`, `/register` et `/reset-password`.
- Les templates d’email de bienvenue et de réinitialisation se configureront directement depuis l’instance Notifuse ; leur ID est défini via `NOTIFUSE_TEMPLATE_WELCOME` et `NOTIFUSE_TEMPLATE_RESET_PASSWORD`.
- Les placeholders disponibles dans les templates Notifuse proviennent de l’application (sans traduction) : `user_name`, `user_email`, `login_url`, `reset_url`, `reset_token`, `ttl_minutes`, `locale`, `brand_name`.
- ### 3.9 GET `/verify-email`

- Route publique empruntée par le lien de confirmation envoyé lors de chaque inscription.
- Paramètres: `id` (identifiant utilisateur) + signature générée par VerifyEmailBundle.
- Effets:
  - Valide la signature via `EmailVerifier`.
  - Marque `User::isEmailVerified=true`.
  - Redirige vers `/login` avec un message flash de succès ou d’échec.
