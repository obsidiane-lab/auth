# Obsidiane Auth - Guide pour Agents (API-only)

Ce document donne une vue synthétique du module d’authentification **API-only** et de son intégration avec le webfront Angular.

---

## 1. Objectifs

- Exposer un backend **API-only** sous `/api` (plus de UI Twig/Vue).
- Front Angular unique (dossier `/webfront`) qui sert `/login`, `/register`, `/reset-password`, `/reset-password/confirm`, `/verify-email`, `/invite/complete`, `/setup`.
- Sessions supprimées: tout est stateless + cookies HttpOnly (JWT access + refresh).
- Vérification Origin/Referer pour les requêtes sensibles (Same Origin).

---

## 2. Architecture applicative

### 2.1 Controllers (API)

| Fichier | Rôle |
| --- | --- |
| `src/Auth/Http/Controller/RegisterController.php` | `POST /api/auth/register` (inscription JSON). |
| `src/Auth/Http/Controller/InviteUserController.php` | `POST /api/auth/invite` (admin). |
| `src/Auth/Http/Controller/AcceptInvitationController.php` | `POST /api/auth/invite/complete` (finalisation invitation). |
| `src/Auth/Http/Controller/InvitePreviewController.php` | `GET /api/auth/invite/preview` (prévisualisation invitation). |
| `src/Auth/Http/Controller/MeController.php` | `GET /api/auth/me`. |
| `src/Auth/Http/Controller/LogoutController.php` | `POST /api/auth/logout`. |
| `src/Auth/Http/Controller/VerifyEmailController.php` | `GET /api/auth/verify-email` (lien signé). |
| `src/Auth/Http/Controller/ResetPasswordController.php` | `POST /api/auth/password/forgot` + `POST /api/auth/password/reset`. |
| `src/Setup/Http/Controller/InitialAdminController.php` | `POST /api/setup/admin`. |
| `json_login (Lexik)` | `POST /api/auth/login`. |
| `refresh_jwt (Gesdinet)` | `POST /api/auth/refresh` (cookie `__Host-rt`). |

### 2.2 ApiResource (API Platform)

- `src/ApiResource/Auth.php` expose register/invite/logout/me + password (forgot/reset).
- `src/ApiResource/Setup.php` expose `/api/setup/admin`.
- `src/ApiResource/FrontendConfig.php` expose `/api/config` (flags + UI config).
- `src/ApiResource/InvitePreview.php` expose `/api/auth/invite/preview`.
- `src/Auth/Http/OpenApi/AuthRoutesDecorator.php` documente login/refresh/verify/password/setup.

### 2.3 Domaine & services

- `src/Auth/Application` : `RegisterUser`, `InviteUser`, `CompleteInvitation`, `RequestPasswordReset`, `ResetPassword`.
- `src/Auth/Infrastructure/Security` : `TokenCookieFactory`, `EmailVerifier`, `UserChecker`, `JsonLoginFailureHandler`.
- `src/Shared/Frontend/FrontendUrlBuilder.php` : construit les liens front (verify, reset, invite).
- `src/Shared/Security` : `PasswordStrengthChecker`.
- `src/Shared/Response` : `ApiResponseFactory`, `UserPayloadFactory`.
- `src/Setup/Application` : `InitialAdminManager`.
- `src/Shared/Mail` : `MailerGateway`.

### 2.4 Entités

- `User`, `RefreshToken`, `ResetPasswordRequest`, `InviteUser`.

---

## 3. Parcours fonctionnels (API + Angular)

### 3.1 Login
- Angular `/login` -> `POST /api/auth/login`.
- Cookies: `__Secure-at` (access) + `__Host-rt` (refresh).

### 3.2 Register
- Angular `/register` -> `POST /api/auth/register`.
- Email de bienvenue avec lien `/verify-email?...` (route Angular).

### 3.3 Verify email
- Angular `/verify-email` lit les query params -> `GET /api/auth/verify-email`.

### 3.4 Reset password
- Angular `/reset-password` -> `POST /api/auth/password/forgot`.
- Email contient lien `/reset-password/confirm?token=...`.
- Angular `/reset-password/confirm` -> `POST /api/auth/password/reset`.

### 3.5 Invitation
- Admin `POST /api/auth/invite` -> email avec lien `/invite/complete?token=...`.
- Angular lit `GET /api/auth/invite/preview?token=...` pour afficher l’email invité et l’état.
- Angular `/invite/complete` -> `POST /api/auth/invite/complete`.

### 3.6 Setup initial admin
- Angular `/setup` -> `POST /api/setup/admin`.

---

## 4. Codes d’erreur (API)

| HTTP | Cas principaux | Détails |
| ---: | --- | --- |
| 400 | Requête invalide, token invalide | `verify-email` (id manquant), reset/verify token invalide, invitation sans token (`details.token = INVALID_INVITATION`). |
| 401 | Non authentifié | `me`, JWT invalide/expiré, service token invalide, login refusé. |
| 403 | Accès refusé | Origin/Referer non autorisé, endpoints admin sans rôle. |
| 404 | Introuvable | Invitation inconnue, user introuvable, inscription désactivée. |
| 409 | Conflit | Email déjà utilisé, invitation déjà acceptée, bootstrap requis ou déjà fait. |
| 410 | Expiré | Invitation expirée, lien de vérification expiré, reset token expiré. |
| 422 | Validation | Email/mot de passe invalides, champs requis, `INVALID_ROLES`, confirmation mot de passe. |
| 423 | Verrouillé | Email non vérifié lors du login. |
| 429 | Rate limit | Login, register, invite, invite/complete, password/forgot/reset, setup/admin. |
| 500 | Erreur interne | Échec de reset password non géré (`ResetRequestFailedException`). |
| 503 | Service indisponible | Échec d’envoi d’email (`MailDispatchException`). |

Identifiants d’erreurs utiles dans les payloads/validations :
- `INVALID_INVITATION`
- `INVALID_ROLES`

---

## 5. Sécurité

- JWT Lexik + Gesdinet refresh tokens.
- Contrôle Origin/Referer (Same Origin).
- Rate limiting: `login_throttling`.
- Cookies: `__Secure-at` (SameSite lax, domaine partagé) + `__Host-rt` (SameSite strict, host-only).

---

## 6. Infra

- Caddyfile unique dans `@obsidiane/caddy/Caddyfile`, avec un snippet monté en `webfront.caddy` (dev/prod).
- `compose.yaml` orchestre `core`, `webfront`, `database` (le core est l’entrypoint).

---

## 7. Feature flags & config

| Variable | Effet |
| --- | --- |
| `REGISTRATION_ENABLED` | Active l’inscription. |
| `PASSWORD_STRENGTH_LEVEL` | Politique de mot de passe. |
| `BRANDING_NAME` | Nom branding (emails). |
| `APP_BASE_URL` | Base URL de l'API (utilisée pour les liens email). |
| `FRONTEND_REDIRECT_URL` | URL de redirection après login. |
| `FRONTEND_THEME_MODE` | Thème par défaut (dark/light). |
| `FRONTEND_THEME_COLOR` | Couleur par défaut (base/red/...). |
| `FRONTEND_THEME_COLORS` | Liste des couleurs disponibles. |
| `API_DOCS_ENABLED` | Active `/api/docs` (dev uniquement). |

---

## 8. Tests

- Pas de tests automatisés fournis.
- Vérifier les parcours via curl/API et via l’UI Angular.
