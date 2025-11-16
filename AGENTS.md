# Obsidiane Auth – Guide pour Agents

Ce document donne une vue synthétique du module d’authentification afin que tout nouvel intervenant (dev, agent IA, SRE) comprenne rapidement l’architecture, les responsabilités et les points de vigilance.

---

## 1. Objectifs du module

- Fournir une authentification sécurisée « dual-mode » :
- **UI** : formulaires Twig accessibles via `/login`, `/register` et `/reset-password` (réinitialisation via ResetPasswordBundle).
- **API JSON** : endpoints sous `/api/auth/*` (me, logout, register) + `/api/login` (Lexik) et `/api/token/refresh`.
- Gérer les sessions JWT short-lived + refresh tokens Gesdinet.
- Appliquer les bonnes pratiques de sécurité : CSRF stateless Symfony, state signé, allowlist de redirections, rate limiting.
  - Les formulaires UI et les clients SPA génèrent un token aléatoire côté client par opération et l’envoient dans l’en-tête `csrf-token` (et, pour les apps web, via un cookie `csrf-token_<token>` / `__Host-csrf-token_<token>` pour la double-soumission).
- Traduction (UI & emails) uniquement disponible en français via `translations/messages.fr.yaml`.

---

## 2. Architecture applicative

### 2.1 Controllers

| Fichier | Rôle principal |
| --- | --- |
| `src/Controller/AuthLoginPageController.php` | Sert la page `/login` (Vue `SignIn`). |
| `src/Controller/AuthRegisterPageController.php` | Sert la page `/register` (Vue `SignUp`). |
| `src/Controller/AuthPageController.php` | Compatibilité: `/` redirige vers la route dédiée selon `view=`. |
| `src/Controller/ResetPasswordController.php` | Flow ResetPasswordBundle: `/reset-password`, `/reset-password/check-email`, `/reset-password/reset/{token}`. |
| `src/Controller/Setup/InitialAdminPageController.php` | Page `/setup` pour créer l’administrateur initial quand aucun utilisateur n’existe. |
| `src/Controller/Setup/InitialAdminController.php` | API `POST /api/setup/admin` (CSRF `initial_admin`) qui crée le premier compte admin. |
| *(Lexik json_login)* | `POST /api/login` – authentifie via `json_login` (CSRF `authenticate`, header `csrf-token`), un subscriber pose le cookie access. |
| `src/Controller/Auth/MeController.php` | `GET /api/auth/me` – retourne l’utilisateur courant. |
| `src/Controller/Auth/LogoutController.php` | `POST /api/auth/logout` – invalide tokens et cookies (CSRF `logout`, header `csrf-token`). |
| _(Gesdinet)_ | `POST /api/token/refresh` – route gérée par JWTRefreshTokenBundle (`refresh_jwt` + cookie HttpOnly). |
| *(CSRF stateless)* | Les flux sensibles (login/register/logout/reset/invite) sont protégés via `SameOriginCsrfTokenManager` (Origin/Referer + header/cookie `csrf-token`). |
| `src/Controller/Auth/VerifyEmailController.php` | `GET /verify-email` – consomme le lien signé VerifyEmailBundle puis redirige vers `/login` avec un flash. |

Les contrôleurs délèguent aux couches métier (services dédiés) pour appliquer le SRP.

### 2.2 Domaine Auth & services associés

| Zone | Contenu |
| --- | --- |
| `src/Auth` | `TokenCookieFactory.php` construit/expire les cookies d’auth (`__Secure-at`, `__Host-rt`); `RedirectPolicy.php` gère l’allowlist de redirection; `UserRegistration.php` + `RegistrationException.php` encapsulent le cas d’usage d’inscription; DTOs `RegisterUserInput` / `RegisterIdentityInput`; `AuthViewPropsBuilder.php` prépare les props UI (endpoints, thème, redirect). |
| `src/EventSubscriber` | `JwtEventSubscriber.php` personnalise le payload Lexik (`iss`, `aud`, etc.) et pose le cookie access sur `AuthenticationSuccessEvent`; `CsrfProtectedRoutesSubscriber.php` applique la vérification CSRF sur les routes sensibles (`/api/login`, reset password, logout, setup admin). |
| `src/Security` | `CsrfRequestValidator.php` valide l’en-tête `csrf-token` via `SameOriginCsrfTokenManager`; `CsrfTokenId.php` liste les ids UI/API; `EmailVerifier.php` génère/valide les liens VerifyEmailBundle; `UserChecker.php` bloque la connexion tant que l’email n’est pas confirmé. |
| `src/Setup` | `InitialAdminManager.php` + `SetupViewPropsBuilder.php` gèrent la détection et la création de l’administrateur initial. |
| `src/Mail` | `MailerGateway.php` + `MailDispatchException.php` centralisent l’appel à Notifuse et la gestion des erreurs d’envoi. |

### 2.3 Entités et Repositories

- `App\Entity\User` : modèle utilisateur (email, password, displayName, roles, `isEmailVerified`).
- `App\Entity\RefreshToken` : entité Gesdinet.
- `App\Repository\UserRepository`, `RefreshTokenRepository`.
- Migrations : `migrations/Version20251103215036.php`, `Version20251104203539.php`.

### 2.4 Infrastructure

- `config/` : fichiers Symfony (security, rate limiter, mailer, Lexik JWT, Gesdinet, etc.). Les routes sont centralisées dans `config/routes.yaml` (routes attributaires, `api_platform` avec préfixe `/api`, loader de logout, erreurs dev).
- `templates/` : `auth/login.html.twig`, `auth/register.html.twig`, `reset_password/request.html.twig`, `reset_password/check_email.html.twig`, `reset_password/reset.html.twig` (toutes héritent de `auth/page_base.html.twig`), `base.html.twig`, composants partagés. Le contrôleur Stimulus `assets/controllers/theme_controller.ts` applique le thème (mode/couleur) à l’initialisation.
- `compose.yaml` + `infra/` : stack Docker (FrankenPHP, MariaDB, Maildev).
- `translations/messages.fr.yaml` : catalogue i18n (UI + emails) en français.
- `assets/styles/app.css` / `assets/app.ts` + Stimulus `controllers/theme_controller.ts` : thème Tailwind & logique front unifiée.

---

## 3. Parcours fonctionnels

> Tant qu’aucun utilisateur n’est présent en base, l’ensemble des formulaires publics redirigent vers `/setup` qui permet de créer l’administrateur initial (`POST /api/setup/admin`). Dès qu’un utilisateur existe, l’application revient aux flows suivants.

### 3.1 Connexion (UI)
1. `GET /login` → rendu Twig (`auth/login.html.twig` → `SignIn`), les props contiennent les endpoints et le `redirect_uri` validé.
2. Le formulaire envoie les identifiants à `POST /api/login` via Axios (`withCredentials: include`). L’intercepteur réseau génère un token CSRF stateless, l’envoie dans le header `csrf-token` et, en cas de 403 CSRF, régénère le token ciblé puis réessaie automatiquement.
3. En cas de succès, l’UI redirige vers la cible allowlistée (`redirect_uri`).

### 3.2 Connexion (API)
- `POST /api/login` (header `csrf-token` requis, id logique `authenticate`, token généré côté client) : réponse JSON `{ user, exp }`.
- Cookies émis : `__Secure-at`, `__Host-rt`.

- **UI** : `/register` monte `SignUp.vue` qui génère un token CSRF stateless côté client et l’envoie dans le header `csrf-token` avec la requête `POST /api/auth/register`. Une notification informe de la réussite.
- **API** : `POST /api/auth/register` retourne `201` + payload utilisateur ; le header `csrf-token` (id logique `register`) est requis et vérifié par `CsrfRequestValidator`.
- Validation Symfony (group `user:register`), erreurs gérées par `RegistrationException`.
- Email de bienvenue (Mailer) avec lien signé VerifyEmailBundle (`/verify-email?id=...`). Tant que l’utilisateur n’a pas cliqué, `User::isEmailVerified=false` et les tentatives de connexion renvoient `EMAIL_NOT_VERIFIED`.

### 3.3 Vérification d’email
- L’email de bienvenue embarque `verify_link` (signé). Le clic appelle `GET /verify-email?id=<userId>&token=...&signature=...`.
- `VerifyEmailController` valide la signature (VerifyEmailHelper), marque `User::isEmailVerified=true` puis redirige vers `/login?flash=auth.verify.success`.
- En cas d’erreur (signature expirée/invalidée), redirige vers `/login?flash=auth.verify.error`.

### 3.3 Réinitialisation du mot de passe (UI)
- Flow ResetPasswordBundle standard:
  1. `GET /reset-password` : formulaire pour saisir l’adresse e‑mail.
  2. `POST /reset-password` : si l’utilisateur existe, un e‑mail est envoyé avec un lien signé.
  3. `GET /reset-password/check-email` : page d’information (TTL du lien).
  4. `GET /reset-password/reset/{token}` puis `POST /reset-password/reset` : définition du nouveau mot de passe, invalidation des refresh tokens.
- Aucune API dédiée n’est exposée pour ce flow.

### 3.4 Token Refresh / Logout
- `POST /api/token/refresh` : géré par Gesdinet (`refresh_jwt`). Le navigateur envoie uniquement le cookie HttpOnly `__Host-rt`, pas de CSRF requis. Rotation single-use et cookie automatiquement re-généré.
- `POST /api/auth/logout` : header `csrf-token` (id logique `logout`), blocklist access token, purge refresh token, expire cookies.

- Le flow de réinitialisation ne passe plus par `/api/auth/password/*`.

---

## 4. Sécurité et conformité

- **JWT** : Lexik + Lcobucci (`JwtEventSubscriber`) enrichit les claims (`iss`, `aud`, `sub`, `iat`, `nbf`, `exp`, `jti`).
- **Refresh tokens** : Gesdinet, single-use, stockés en DB, TTL configurable.
- **CSRF** :
- `CsrfTokenId.php` liste les identifiants (`authenticate`, `register`, `password_request`, `password_reset`, `logout`, `initial_admin`, `invite_user`, `invite_complete`). `CsrfRequestValidator` vérifie l’en-tête `csrf-token` via `SameOriginCsrfTokenManager` (stateless, Origin/Referer + header/cookie).
- **Rate Limiting** : `login_throttling` (firewall `api`) via un service `app.login_rate_limiter` (DefaultLoginRateLimiter) basé sur deux limiters framework `login_local`/`login_global`.
- **Redirect allowlist** : `RedirectPolicy` filtre les `redirect_uri`.
- **Secure cookies** : HttpOnly + Secure (config dépend env). Access cookie `__Secure-at` (SameSite `lax`, domaine partagé) et refresh cookie `__Host-rt` (SameSite `strict`, host-only AUTH).
- **Access Control** : les routes publiques couvrent `login`, `register`, `password/request`, `password/reset`, `token/refresh`, `logout`, `/setup`, `/api/setup/admin` et `/verify-email`; toutes les autres routes `/api` nécessitent une authentification applicative. `UserChecker` bloque la connexion tant que `User::isEmailVerified=false`.

---

## 5. Tests & Outils

- Pas de tests automatisés fournis pour l’instant.
- Vérifications rapides : `php -l` sur fichiers modifiés, curl pour endpoints (voir README). Générez un token CSRF stateless (ex. `php -r 'echo bin2hex(random_bytes(16));'`) et envoyez-le dans le header `csrf-token` pour les mutations protégées.
- Docker Compose : `docker compose up` lance FrankenPHP + MariaDB + Maildev.

---

## 6. Points d’attention pour futurs travaux

- Ajouter des tests fonctionnels/API pour sécuriser les flows critiques.
- Prévoir la gestion d’activation de compte / confirmation si requis.
- Gestion d’erreurs mailer : pour l’instant silencieuse (log éventuel à prévoir).
- Documentation front (Angular) : s’assurer que les headers `csrf-token` sont bien transmis.

---

## 7. Quick start pour un agent

1. Installer dépendances : `composer install`.
2. Lancer l’environnement : `docker compose up`.
3. Appliquer migrations : `php bin/console doctrine:migrations:migrate`.
4. Lancer les tests end-to-end interactifs :
   - `./test/e2e.sh`
   - Le script demande les emails/mots de passe (admin, utilisateur, invité), joue les flows principaux (setup initial, login/logout, inscription, reset password, invitation) et indique quand une action manuelle est nécessaire (clic sur lien d’email).
5. Vérifier manuellement si besoin avec `curl` (voir README pour des exemples ciblés).

---

## 8. Feature flags & configuration

Les fonctionnalités clés sont pilotées par variables d’environnement (Docker, orchestrateur, `.env`). Mettre `0` pour désactiver.

| Variable | Effet |
| --- | --- |
| `UI_ENABLED` | Active l’interface publique (Twig/Vue). |
| `REGISTRATION_ENABLED` | Autorise l’inscription côté UI/API. |
| `UI_THEME_COLOR` | Définit la couleur Tailwind par défaut (ex. `emerald`, `indigo`). |
| `UI_THEME_MODE` | Définit le mode (light/dark) de l’interface (défaut `dark`). Piloté par l’environnement, non modifiable par l’utilisateur. |
| `BRANDING_NAME` | Détermine le nom affiché dans les titres UI/emails (défaut `Obsidiane Auth`). |

La UI masque automatiquement l’inscription si désactivée. Consultez `docs/CONFIGURATION.md` pour un pas-à-pas container + variables.

Consultez également `docs/USER_GUIDE.md` pour le guide d’usage (cookies/tokens, CSRF, CORS, intégration SPA) et `docs/CONFIGURATION.md` pour la configuration avancée.

---

> 🎯 **Résumé** : Ce module fournit toute la chaîne d’authentification JWT avec refresh, UI intégrée et endpoints API, en respectant les principes SOLID (services spécialisés), le clean code et en sécurisant les interactions (CSRF stateless, rate limiting, allowlist). Les agents peuvent se baser sur ce guide pour intervenir efficacement : corrections, extensions ou intégrations front/back. Bonne mission !
