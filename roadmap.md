# Roadmap v3 - Refonte globale (core + webfront)

## 0) Synthese (validee)

Objectif: backend API-only expose sous `/api`, front Angular unique pour toute la UI, un seul point d entree Caddy. Rework complet sans compatibilite legacy. Sessions supprimees. Login conserve via Lexik json_login + cookies HttpOnly.

## 1) Decisions validees

- Meme domaine pour backend + webfront (Caddy route `/api` vers core, reste vers Angular).
- Liens email pointent vers des routes Angular qui transmettent a l API.
- Pas de compatibilite UI legacy: suppression totale de Vue/Twig/Encore/webpack dans `core`.
- Dev: `ng serve` uniquement (pas de build statique local via Caddy en dev).
- Login conserve via Lexik `json_login`, cookies HttpOnly (access + refresh).
- Suppression des sessions Symfony (reset token passe en payload).
- CORS/ALLOWED_ORIGINS remains via variables d environnement.
- Cookie policy reste en sous-domaines (cookies partages sur le domaine).
- `/api/docs` non expose en prod.
- Pas de tests a livrer dans cette refonte.
- Pas d impact DB attendu (ou impact maitrise si necessaire).
- SDKs a revoir et regenerer via OpenAPITools openapi-generator.

## 2) Etat des lieux detaille (audit rapide)

Backend (`/core`):
- Symfony + API Platform + Lexik JWT + Gesdinet Refresh.
- UI Vue + Twig active (routes `/login`, `/register`, `/reset-password`, `/setup`, `/invite/complete`).
- ResetPasswordController melange UI + API, utilise session.
- VerifyEmailController redirige vers `/login`.
- `routes.yaml` declare des routes hors API (`/reset-password`, `/verify-email`).
- `security.yaml` contient un firewall `auth_pages`.
- Caddyfile dans `core/infra/frankenphp/Caddyfile`.

Frontend (`/webfront`):
- Angular template non branche a l API.

Infra:
- `compose.yaml` dans `/core` uniquement.

## 3) Vision cible (detail)

### 3.1 Backend `core` (API-only)
- Routes exposees uniquement sous `/api/*`.
- Login = json_login Lexik (documente OpenAPI).
- Reset password sans session: token en payload.
- Verify email via endpoint API (reponse JSON).
- Suppression des controllers de pages UI + templates Twig.
- `security.yaml`: suppression firewall `auth_pages`, ajustement access_control.
- `/api/docs` disable en prod (condition env).

### 3.2 Frontend `webfront` (Angular)
- Routes UI: `/login`, `/register`, `/reset-password`, `/reset-password/:token`, `/verify-email`, `/invite/complete`, `/setup`.
- Chaque page appelle l API correspondante.
- Service HTTP avec `withCredentials: true`, header `csrf-token`, retry sur 403 CSRF.
- Auth state: `/api/auth/me` + refresh cyclique.

### 3.3 Gateway (Caddy)
- Un seul Caddyfile root:
  - `/api/*` -> backend core
  - reste -> webfront (SPA)
- Dev: on garde `ng serve` direct (pas de Caddy proxy pour webfront en local si non souhaite).

## 4) Contrat API (version cible)

### 4.1 Endpoints essentiels

- POST `/api/auth/login` (json_login) -> cookies mis a jour, payload `user` + `exp`.
- POST `/api/auth/refresh` -> cookies mis a jour, payload `exp`.
- POST `/api/auth/logout` -> 204.
- GET  `/api/auth/me` -> user courant.
- POST `/api/auth/register` -> 201 + user.
- POST `/api/auth/password/forgot` -> 202.
- POST `/api/auth/password/reset` -> 204 (token + password).
- POST `/api/auth/invite` -> 202.
- POST `/api/auth/invite/complete` -> 201.
- POST `/api/setup/admin` -> 201.
- POST `/api/auth/verify-email` -> 200/400 (validation lien).

### 4.2 DTOs proposes

- `AuthLoginInput` (email, password) / `AuthLoginOutput` (user, exp).
- `RegisterUserInput` (existe) / `RegisterUserOutput`.
- `PasswordForgotInput` (email).
- `PasswordResetInput` (token, password).
- `InviteUserInput` (email, roles?).
- `InviteCompleteInput` (token, password, profile...).
- `SetupInitialAdminInput` / `SetupInitialAdminOutput`.
- `VerifyEmailInput` (id, token, signature, expires) ou token unique selon format.

### 4.3 Regles transverses

- `csrf-token` obligatoire sur POST sensibles.
- Erreurs homogenes via `ApiResponseFactory`.
- OpenAPI: etendre `AuthRoutesDecorator` pour login, refresh, verify, reset.
- `/api/docs` conditionne par env (prod: off).

## 5) Plan de migration (phases)

### Phase 1 - Backend API-only
- Supprimer controllers UI + templates Twig.
- Refondre `ResetPasswordController` en API-only (token en payload, pas de session).
- Creer endpoint API pour verify email.
- Nettoyer `routes.yaml` (uniquement `/api`).
- Ajuster `security.yaml` (retirer firewall UI + access_control UI).
- DTO + validation groups + documentation OpenAPI.
- Ajuster `CsrfProtectedRoutesSubscriber` si routes evoluent.

### Phase 2 - Webfront Angular
- Implementer `AuthApiService` + interceptor CSRF.
- Brancher pages auth + reset + invite + setup.
- Ajouter guard auth minimal (me -> redirect login).
- Ajouter env `apiBaseUrl = /api`.

### Phase 3 - Infra unifiee
- Creer Caddyfile root pour routing `/api` -> core, reste -> webfront.
- Creer compose root (services core + webfront + caddy).
- En dev, webfront tourne en `ng serve` (pas de proxy obligatoire).

### Phase 4 - Nettoyage + SDKs
- Supprimer Vue/Twig/Encore/webpack dans core.
- Regenerer SDKs via OpenAPI Generator.
- Mettre a jour README + AGENTS + docs.

## 6) SDKs (OpenAPI Generator)

- Export OpenAPI depuis API Platform.
- Generer:
  - SDK JS/TS (webfront + clients).
  - SDK PHP (clients backend).
- Remplacer `packages/auth-client-js` et `packages/auth-client-php` par code genere.

## 7) Risques et mitigations

- Liens email doivent pointer sur Angular (sinon UX casse).
- CORS/Origin strict: config variable a bien aligner.
- Cookies sous-domaines: s assurer que Caddy est sur le domaine racine.
- OpenAPI doc en prod: a desactiver proprement via env.

## 8) Definition of Done

- Backend: aucune route UI, uniquement `/api`, sessions supprimees.
- Frontend: tous les parcours auth operational en Angular.
- Infra: Caddy unique route `/api` vers core, reste vers webfront.
- SDKs regeneres via openapi-generator.
- Doc actualisee.
