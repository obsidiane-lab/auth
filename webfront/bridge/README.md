# @auth/bridge

Bridge Angular (runtime + models TypeScript) pour une API Platform (Hydra/JSON-LD), avec support Mercure/SSE optionnel.

Le package expose une API Angular volontairement minimaliste :
- `provideBridge()` pour configurer le bridge (HTTP + tokens + Mercure) ;
- `FacadeFactory` / `ResourceFacade<T>` pour une API orientée ressource ;
- `BridgeFacade` pour des appels ad-hoc.

## Installation

```bash
npm i @auth/bridge
```

Le bridge est conçu pour être installé dans une application Angular. Les dépendances Angular et RxJS sont des `peerDependencies`.

## Compatibilité

- Angular `@angular/*` `^20.1.0`
- RxJS `^7.8.0`

## Démarrage rapide

Configurez le bridge au démarrage de l’application avec `provideBridge()` (requis).

### Application standalone (recommandé)

```ts
// app.config.ts (ou main.ts)
import {ApplicationConfig} from '@angular/core';
import {provideBridge} from '@auth/bridge';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBridge({
      baseUrl: 'https://api.example.com',
      mercure: {hubUrl: 'https://api.example.com/.well-known/mercure'},
    }),
  ],
};
```

### Application NgModule

```ts
import {NgModule} from '@angular/core';
import {provideBridge} from '@auth/bridge';

@NgModule({
  providers: [
    provideBridge({baseUrl: 'https://api.example.com'}),
  ],
})
export class AppModule {}
```

## Configuration

`provideBridge({ ... })` accepte notamment :
- `baseUrl` (requis) ;
- `auth` (Bearer ou interceptor custom) ;
- `mercure` (hubUrl + options SSE) ;
- `defaults` (headers/timeout/retries) ;
- `singleFlight` (déduplication “in-flight” des requêtes HTTP identiques `GET/HEAD/OPTIONS`) ;
- `debug` (logs runtime) ;
- `extraInterceptors` (interceptors Angular additionnels).

### Cookies / `withCredentials`

Le bridge peut envoyer des cookies (sessions) côté HTTP et SSE.

Le comportement `withCredentials` par défaut est déduit de `mercure.init` :
- `credentials: 'include'` (défaut) → cookies envoyés
- `credentials: 'omit'` → cookies non envoyés

Vous pouvez aussi surcharger au cas par cas via `opts.withCredentials` sur les appels HTTP.

```ts
import {provideBridge} from '@auth/bridge';

provideBridge({
  baseUrl: 'https://api.example.com',
  mercure: {
    hubUrl: 'https://api.example.com/.well-known/mercure',
    init: {credentials: 'omit'},
  },
});
```

### Auth (Bearer)

`auth` accepte :
- une string (token Bearer),
- `{ type: 'bearer', token }`,
- `{ type: 'bearer', getToken }` (sync ou async),
- ou un `HttpInterceptorFn` custom.

```ts
import {provideBridge} from '@auth/bridge';

provideBridge({
  baseUrl: 'https://api.example.com',
  auth: {type: 'bearer', getToken: () => localStorage.getItem('token') ?? undefined},
});
```

### Defaults (headers / timeout / retries)

```ts
import {provideBridge} from '@auth/bridge';

provideBridge({
  baseUrl: 'https://api.example.com',
  defaults: {
    headers: {'X-Requested-With': 'fetch'},
    timeoutMs: 15_000,
    retries: {count: 2, delayMs: 250, methods: ['GET']},
  },
});
```

### Debug

```ts
import {provideBridge} from '@auth/bridge';

provideBridge({baseUrl: 'https://api.example.com', debug: true});
```

## Appeler l’API

### Style orienté ressource (`FacadeFactory` + `ResourceFacade<T>`)

```ts
import {inject} from '@angular/core';
import {FacadeFactory, ResourceFacade, Item} from '@auth/bridge';

type Book = Item & {title?: string};

export class BooksService {
  private readonly factory = inject(FacadeFactory);
  readonly books: ResourceFacade<Book> = this.factory.create<Book>({url: '/api/books'});
}
```

Exemples :

```ts
// collection Hydra
this.books.getCollection$({page: 1, itemsPerPage: 20, filters: {title: 'Dune'}});

// item (souvent via @id)
this.books.get$(book['@id']!);

// write
this.books.post$({title: 'Neuromancer'});
this.books.patch$(book['@id']!, {title: 'Count Zero'});
this.books.delete$(book['@id']!);
```

### Style ad-hoc (`BridgeFacade`)

```ts
import {inject} from '@angular/core';
import {BridgeFacade} from '@auth/bridge';

export class HealthService {
  private readonly bridge = inject(BridgeFacade);
  getHealth$() {
    return this.bridge.get$<{status: string}>('/health');
  }
}
```

## Realtime (Mercure/SSE)

Le realtime est inactif tant que `mercure.hubUrl` n’est pas fourni à `provideBridge()`.

```ts
provideBridge({
  baseUrl: 'https://api.example.com',
  mercure: {hubUrl: 'https://api.example.com/.well-known/mercure', topicMode: 'url'},
});
```

### Concurrence

Le bridge maintient une seule connexion SSE (une seule `EventSource`) et mutualise les topics :
- regarder plusieurs fois la même ressource ne crée pas plusieurs connexions ;
- un même topic est dédoublonné et géré par ref-count (unsubscribe effectif quand plus personne n’écoute).

Côté HTTP, le bridge déduplique les requêtes identiques tant qu’elles sont en cours (single-flight, activé par défaut) :
- `GET` / `HEAD` / `OPTIONS` : deux appels identiques partagent le même appel réseau et reçoivent la même réponse ;
- les méthodes avec body (`POST`/`PUT`/`PATCH`/`DELETE`) ne sont pas dédupliquées.

Ce n’est pas un cache : une fois la requête terminée, un nouvel appel identique relance un nouvel appel réseau.

Pour désactiver :

```ts
provideBridge({baseUrl: 'https://api.example.com', singleFlight: false});
```

API :
- `ResourceFacade<T>.watch$(iri | iri[])` / `unwatch(iri | iri[])`
- `ResourceFacade<T>.watchSubResource$(iri | iri[], 'field.path')`
- `BridgeFacade.watch$(iri | iri[])` / `unwatch(iri | iri[])`

Note SSR : la connexion SSE ne s’ouvre que dans le navigateur.

## Models TypeScript

Les models générés (si présents) sont exportés au même niveau que le runtime :

```ts
import type {Item} from '@auth/bridge';
// import type {Book} from '@auth/bridge';
```

En JSON-LD (`application/ld+json`), l’IRI est typiquement dans `model['@id']`.

---

## Documentation du projet

# Obsidiane Auth

Service d’authentification **stateless** pour applications web & SPA, basé sur **Lexik JWT (HS256)** et **Gesdinet
Refresh Tokens**.  
Il fournit un login centré **cookies HttpOnly** (`__Secure-at` / `__Host-rt` en prod, `at` / `rt` en dev compose), des endpoints API simples et une
validation **Origin/Referer** (Same Origin).

> UI Angular (dossier `/webfront`), tokens en cookies sécurisés, refresh rotatif, vérification d’email.

---

## Sommaire

- [Vue d’ensemble](#vue-densemble)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Démarrage rapide](#démarrage-rapide)
- [API & flux principaux](#api--flux-principaux)
- [Codes d’erreur (API)](#codes-derreur-api)
- [Intégration front (SPA)](#intégration-front-spa)
- [Configuration & déploiement](#configuration--déploiement)
- [SDKs](#sdks)
- [Bridge Meridiane](#bridge-meridiane)
- [Notes de sécurité](#notes-de-sécurité)
- [Contribuer](#contribuer)
- [Licence](#licence)

---

## Vue d’ensemble

- Service d’auth centré **cookies HttpOnly** : access token JWT (`__Secure-at`) + refresh opaque (`__Host-rt`) en prod.
- Deux usages possibles :
  - UI Angular : `/login`, `/register`, `/reset-password`, `/reset-password/confirm`, `/verify-email`, `/invite/complete`, `/setup`.
  - API JSON : `/api/auth/...` pour front SPA, mobile, backends.
- Sécurité intégrée : validation Origin/Referer, vérification d’email, rate limiting, redirections allowlistées.
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
  - `__Secure-at` : access token JWT (HttpOnly, prod).
  - `__Host-rt` : refresh token opaque, single-use (HttpOnly, prod).
  - En dev local via `docker compose` : `at` / `rt` (HTTP).
  - Validation Origin/Referer (Same Origin) sur les requêtes sensibles.

---

## Architecture

- **Access token (JWT)**
  - Claims standard (`iss`, `aud`, `sub`, `iat`, `nbf`, `exp`, `jti`).
  - Stocké en cookie HttpOnly `__Secure-at`.

- **Refresh token (opaque)**
  - Stocké en base + cookie HttpOnly `__Host-rt` (host-only, single-use).

- **Origin/Referer**
  - Validation Same Origin sur les requêtes sensibles.

- **Vérification d’email**
  - L’inscription envoie un lien vers `/verify-email?...` (front), qui appelle `/api/auth/verify-email`.
  - Tant que l’email n’est pas confirmé, le login est refusé (`EMAIL_NOT_VERIFIED`).

---

## Démarrage rapide

Par défaut, `docker compose` expose une entrée unique sur `http://localhost:8000` (Caddy dans le core).
`/api` est routé vers Symfony, le reste vers le webfront (Angular via `ng serve`).
Le routing Caddy est dans `@obsidiane/caddy/Caddyfile` et le bloc frontend est injecté via `webfront.caddy`
(`@obsidiane/caddy/webfront.dev.caddy` en dev, `@obsidiane/caddy/webfront.prod.caddy` en prod).

La documentation OpenAPI générée par API Platform est disponible sur `http://localhost:8000/api/docs`.

### Installation

```bash
# Dépendances PHP (dans le dossier core/)
cd core && composer install && cd ..

# Démarrer le core
docker compose up -d

# Installer les dépendances du webfront (premier lancement)
docker compose run --rm webfront npm install

# Lancer le webfront (si besoin)
docker compose up -d webfront

# Migrations
docker compose exec core php bin/console doctrine:migrations:migrate
```

### Commandes Makefile (à la racine)

Le projet fournit un Makefile avec des commandes pratiques pour le développement :

#### Génération du Bridge

```bash
# Générer le bridge Angular depuis l'OpenAPI spec
make bridge

# Nettoyer les fichiers générés
make bridge-clean
```

#### SDK npm (Angular package)

```bash
# Générer le package Angular complet (quand l'API change)
make sdk-npm

# Nettoyer les fichiers générés
make sdk-npm-clean
```

**Workflow de publication:**
1. Quand l'API change: `make sdk-npm` pour régénérer le package complet
2. Committez le package: `git add packages/auth-client-js/ && git commit -m "chore: regenerate SDK"`
3. Push sur master: Le CI publie automatiquement le package committé sur npmjs.com

Le package est construit avec **meridiane build** (ng-packagr) et **entièrement committé** dans le repo, prêt à publier.

#### Build & Tests

```bash
# Nettoyer le dossier dist
make clean

# Linter le code (webfront uniquement)
make lint

# Build development
make build

# Build production
make build-prod

# Checks rapides (lint + build dev)
make check

# Tests complets production (lint + build prod + PHPStan)
make check-prod
# ou
make test
```

**Avant de push :** Lancez `make test` pour vérifier que tout passe (lint, build production, PHPStan).

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
# Login
curl -i \
  -c cookiejar.txt \
  -H 'Content-Type: application/json' \
  -H "Origin: http://localhost:8000" \
  -d '{"email":"user@example.com","password":"Secret123!"}' \
  http://localhost:8000/api/auth/login

# Profil courant
curl -i -b cookiejar.txt http://localhost:8000/api/auth/me

# Refresh
curl -i -b cookiejar.txt -H "Origin: http://localhost:8000" -X POST http://localhost:8000/api/auth/refresh
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
|     GET | `/api/auth/invite/preview`  | Prévisualiser une invitation              |
|    POST | `/api/auth/invite/complete` | Compléter une invitation                  |
|     PUT | `/api/users/{id}/roles`     | Mettre à jour les roles (admin)           |

Les payloads détaillés, codes de réponse et schémas sont disponibles dans `http://<APP_BASE_URL>/api/docs` (OpenAPI).

---

## Codes d’erreur (API)

L’API expose des erreurs HTTP standard. Selon le format (`Accept`), la réponse suit le schéma Problem Details/JSON
ou Hydra, mais les statuts restent identiques.

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
- `INVALID_INVITATION` (token manquant ou invalide lors du preview).
- `INVALID_ROLES` (payload de roles invalide).

---

## Origin/Referer

Tous les endpoints sensibles (login, register, reset, logout, setup, invitation) valident l’**Origin/Referer** :

- Le backend vérifie le Same Origin via les en-têtes `Origin` ou `Referer`.
- Cela implique d’utiliser un reverse-proxy pour servir `/api` et le front sous le même domaine.

---

## Intégration front (SPA)

### Cookies

* Toujours activer `credentials: 'include'` côté client (`fetch`, Axios, Angular `HttpClient`, …).
* Côté navigateur, **aucun stockage manuel de token** :
  * pas de `localStorage` / `sessionStorage` ;
  * le serveur lit directement le cookie `__Secure-at`.

### Refresh silencieux

* Appeler régulièrement `POST /api/auth/refresh` (avec `credentials: 'include'`) avant l’expiration (`exp`).
* Aucun token supplémentaire n’est requis sur ce endpoint (Origin/Referer uniquement).

---

## Configuration & déploiement

### `.env` & Docker

* `core/.env` fournit des valeurs par défaut **orientées production** (cookies sécurisés). Ne mets aucun secret sensible dans ce fichier versionné.
* Le `.env` racine sert à la substitution de variables pour `docker compose` (ex: `NOTIFUSE_*`).
* En local, les valeurs **dev** sont définies directement dans `compose.yaml` (APP_ENV=dev, cookies non Secure, CORS localhost, DB `database:3306`).
* `docker compose` lit automatiquement `.env` ; toute variable peut être surchargée par l’environnement du runtime/compose.
* L’entrypoint génère `APP_SECRET` et `JWT_SECRET` si absents, mais ces valeurs tournent à chaque redémarrage : renseigne-les pour un déploiement réel.

### Compose prod local

Pour un run prod-like local (front statique inclus dans l’image) :

```bash
docker compose -f compose.prod.yaml up -d --build
```

### Variables d’environnement importantes

Les variables ci-dessous couvrent 95 % des cas. Copie/colle ce bloc puis adapte-le à ton infra.

Variables **critiques** vérifiées au démarrage (entrypoint) : `APP_BASE_URL`, `FRONTEND_REDIRECT_URL`, `APP_SECRET`, `DATABASE_URL`, `JWT_SECRET`, `NOTIFUSE_API_BASE_URL`, `NOTIFUSE_WORKSPACE_ID`, `NOTIFUSE_API_KEY`.

**Bloc prêt à copier-coller (prod typique)**

```env
APP_BASE_URL=https://auth.example.com
FRONTEND_REDIRECT_URL=https://app.example.com/

APP_SECRET=change-me
JWT_SECRET=change-me-too
DATABASE_URL="mysql://app:!ChangeMe!database:3306/app?serverVersion=10.11.2-MariaDB&charset=utf8mb4"

JWT_ISSUER=${APP_BASE_URL}
JWT_AUDIENCE=core-api
JWT_ACCESS_TTL=600
JWT_REFRESH_TTL=2592000
ALLOWED_ORIGINS="^https?://example.com(:[0-9]+)?$"

ACCESS_COOKIE_DOMAIN=".example.com"

REGISTRATION_ENABLED=1
PASSWORD_STRENGTH_LEVEL=2
API_DOCS_ENABLED=0

# Token S2S (Authorization: Bearer ...) pour les services internes
SERVICE_AUTH_TOKEN=change-me

NOTIFUSE_API_BASE_URL=https://notifuse.example.com
NOTIFUSE_WORKSPACE_ID=prod-workspace
NOTIFUSE_API_KEY=change-me
NOTIFUSE_TEMPLATE_WELCOME=welcome
NOTIFUSE_TEMPLATE_RESET_PASSWORD=resetpass
```
  
Variables complémentaires (généralement à garder telles quelles) :

- `JWT_ALGORITHM` (HS256), `JWT_AUDIENCE`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`
- `ACCESS_COOKIE_NAME`, `ACCESS_COOKIE_PATH`, `ACCESS_COOKIE_SAMESITE`, `ACCESS_COOKIE_SECURE`
- `BRANDING_NAME`, `API_DOCS_ENABLED`
- Rate limiting : `RATE_LOGIN_LIMIT`, `RATE_LOGIN_INTERVAL`, `RATE_LOGIN_GLOBAL_LIMIT`

### Valeurs par défaut des variables d’environnement

#### Core (defaults de `core/.env`)

| Variable | Valeur par défaut |
| --- | --- |
| `APP_ENV` | `prod` |
| `APP_DEBUG` | `0` |
| `APP_SECRET` | `` |
| `APP_BASE_URL` | `` |
| `DATABASE_URL` | `` |
| `ALLOWED_ORIGINS` | `^https?://example.com(:[0-9]+)?$` |
| `JWT_ALGORITHM` | `HS256` |
| `JWT_SECRET` | `` |
| `JWT_ISSUER` | `${APP_BASE_URL}` |
| `JWT_AUDIENCE` | `core-api` |
| `JWT_ACCESS_TTL` | `600` |
| `JWT_REFRESH_TTL` | `2592000` |
| `ACCESS_COOKIE_NAME` | `__Secure-at` |
| `ACCESS_COOKIE_DOMAIN` | `` |
| `ACCESS_COOKIE_PATH` | `/` |
| `ACCESS_COOKIE_SAMESITE` | `lax` |
| `ACCESS_COOKIE_SECURE` | `1` |
| `REFRESH_COOKIE_NAME` | `__Host-rt` |
| `REFRESH_COOKIE_SECURE` | `1` |
| `FRONTEND_REDIRECT_URL` | `` |
| `TRUSTED_PROXIES` | `127.0.0.1` |
| `REGISTRATION_ENABLED` | `1` |
| `BRANDING_NAME` | `Obsidiane Auth` |
| `PASSWORD_STRENGTH_LEVEL` | `2` |
| `FRONTEND_THEME_MODE` | `dark` |
| `FRONTEND_THEME_COLOR` | `base` |
| `FRONTEND_THEME_COLORS` | `base,red,blue,orange,yellow,green,violet` |
| `RATE_LOGIN_LIMIT` | `5` |
| `RATE_LOGIN_INTERVAL` | `60 seconds` |
| `RATE_LOGIN_GLOBAL_LIMIT` | `25` |
| `API_DOCS_ENABLED` | `0` |
| `NOTIFUSE_API_BASE_URL` | `` |
| `NOTIFUSE_WORKSPACE_ID` | `` |
| `NOTIFUSE_API_KEY` | `` |
| `NOTIFUSE_TEMPLATE_WELCOME` | `welcome` |
| `NOTIFUSE_TEMPLATE_RESET_PASSWORD` | `resetpass` |

#### Racine (defaults de `.env` pour `docker compose`)

| Variable | Valeur par défaut |
| --- | -- |
| `NOTIFUSE_API_BASE_URL` | `https://relay.obsidiane.fr` |
| `NOTIFUSE_API_KEY` | `` |

#### Dev local (`compose.yaml` -> service `core`)

| Variable | Valeur par défaut |
| --- | --- |
| `APP_BASE_URL` | `http://localhost:${CADDY_HTTP_PORT:-8000}` |
| `APP_SECRET` | `secret` |
| `APP_ENV` | `dev` |
| `ACCESS_COOKIE_NAME` | `at` |
| `ACCESS_COOKIE_DOMAIN` | `localhost` |
| `ACCESS_COOKIE_SECURE` | `0` |
| `REFRESH_COOKIE_NAME` | `rt` |
| `REFRESH_COOKIE_SECURE` | `0` |
| `XDEBUG_MODE` | `off` |
| `ALLOWED_ORIGINS` | `^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$` |
| `DATABASE_URL` | `mysql://app:ChangeMe@database:3306/app` |
| `JWT_SECRET` | `!ChangeThisMercureHubJWTSecretKey!` |
| `FRONTEND_REDIRECT_URL` | `http://localhost:4200/` |
| `NOTIFUSE_API_BASE_URL` | `${NOTIFUSE_API_BASE_URL:-}` |
| `NOTIFUSE_WORKSPACE_ID` | `obsidiane` |
| `NOTIFUSE_API_KEY` | `${NOTIFUSE_API_KEY:-}` |
| `BRANDING_NAME` | `Obsidiane` |
| `NOTIFUSE_TEMPLATE_WELCOME` | `welcome` |
| `NOTIFUSE_TEMPLATE_RESET_PASSWORD` | `resetpass` |
| `API_DOCS_ENABLED` | `1` |
| `REGISTRATION_ENABLED` | `1` |

#### Dev local (`compose.yaml` -> service `database`)

| Variable | Valeur par défaut |
| --- | --- |
| `MYSQL_DATABASE` | `${MYSQL_DATABASE:-app}` |
| `MYSQL_USER` | `${MYSQL_USER:-app}` |
| `MYSQL_PASSWORD` | `${MYSQL_PASSWORD:-ChangeMe}` |
| `MYSQL_RANDOM_ROOT_PASSWORD` | `true` |

#### Tests/optionnels (non définis par défaut)

| Variable | Valeur par défaut |
| --- | --- |
| `SERVICE_AUTH_TOKEN` | `` |
| `SERVICE_AUTH_TOKEN_NEXT` | `` |
| `TEST_TOKEN` | `` |

---

### Configuration frontend (`/api/config`)

Le frontend consomme `/api/config` (public) pour piloter l’UI et la politique de mots de passe.

| Variable | Champ `/api/config` | Effet côté UI |
| --- | --- | --- |
| `APP_ENV` | `environment` | `dev` affiche le ThemeSwitcher + persistance locale; tout autre env masque le switcher et force le thème fourni. |
| `REGISTRATION_ENABLED` | `registrationEnabled` | Active l’inscription (route `/register`). |
| `PASSWORD_STRENGTH_LEVEL` | `passwordStrengthLevel` | Niveau 1–4 (weak → very strong) pour validation + jauge de force. |
| `BRANDING_NAME` | `brandingName` | Nom affiché dans l’UI et utilisé dans les emails. |
| `FRONTEND_REDIRECT_URL` | `frontendRedirectUrl` | Redirection après login si fournie. |
| `FRONTEND_THEME_MODE` | `themeMode` | `light` ou `dark` (appliqué en non‑dev). |
| `FRONTEND_THEME_COLOR` | `themeColor` | Couleur principale (`base`, `red`, `blue`, `orange`, `yellow`, `green`, `violet`, `cyan`, `rose`). |

En environnement non‑dev, le thème est **forcé** par `/api/config` (pas de lecture `localStorage`).

---

## Architecture du code

### Structure du projet

```
obsidiane-auth/
├── core/                      # Backend Symfony (API Platform)
│   ├── src/
│   │   ├── Auth/             # Use cases d'authentification
│   │   ├── Controller/       # Controllers API
│   │   ├── Entity/           # Entités Doctrine
│   │   ├── Dto/              # DTOs pour validation
│   │   ├── Repository/       # Repositories Doctrine
│   │   ├── Security/         # Voters, EmailVerifier, JWT
│   │   ├── EventSubscriber/  # Event subscribers
│   │   └── ...
│   ├── config/               # Configuration Symfony
│   ├── migrations/           # Migrations Doctrine
│   └── phpstan.neon.dist     # Configuration PHPStan
│
├── webfront/                  # Frontend Angular
│   ├── src/app/
│   │   ├── core/             # Services, repositories, guards
│   │   ├── modules/          # Modules fonctionnels (auth, error)
│   │   ├── shared/           # Composants partagés
│   │   └── ...
│   ├── bridge/               # Bridge généré par Meridiane
│   ├── .eslintrc.json        # Configuration ESLint
│   └── angular.json          # Configuration Angular
│
├── packages/                  # SDKs clients
│   ├── auth-client-php/      # SDK PHP (Symfony)
│   └── auth-client-js/       # SDK JavaScript/TypeScript
│
├── @obsidiane/               # Configuration partagée
│   ├── caddy/                # Configuration Caddy
│   └── docs/                 # Documentation technique
│
├── Makefile                   # Commandes de développement
├── compose.yaml              # Docker Compose (dev)
└── compose.prod.yaml         # Docker Compose (prod)
```

### Standards de code

#### Backend (PHP/Symfony)

- **PSR-12** : Standard de code PHP
- **PHPStan Level 6** : Analyse statique stricte
- **Type hints stricts** : `declare(strict_types=1)` dans tous les fichiers
- **Injection de dépendances** : Constructor injection via autowiring
- **DTOs** : Validation avec Symfony Validator
- **Readonly classes** : Favoriser l'immutabilité (PHP 8.2+)

Tous les fichiers PHP doivent passer PHPStan sans erreur :
```bash
cd core && vendor/bin/phpstan analyse -c phpstan.neon.dist
```

#### Frontend (Angular/TypeScript)

- **Angular 21** : Standalone components, signals, inject()
- **TypeScript strict mode** : Tous les flags stricts activés
- **ESLint** : Configuration custom avec règles Angular
- **Prefer inject()** : Utiliser `inject()` au lieu de constructor injection
- **Control flow** : Utiliser `@if`/`@for` au lieu de `*ngIf`/`*ngFor`
- **Signals** : Favoriser les signals pour la réactivité
- **Standalone** : Tous les composants sont standalone

Tous les fichiers doivent passer le linter :
```bash
cd webfront && npm run lint
```

### Qualité du code

Le projet maintient une qualité de code stricte :

- ✅ **85 règles ESLint** appliquées sur le frontend
- ✅ **Zero erreur PHPStan** sur le backend (Level 6)
- ✅ **TypeScript strict** avec tous les flags activés
- ✅ **Tests automatisés** via `make test`

---

## Tests & SDKs

### Tests end-to-end (webfront)

Des tests Playwright sont disponibles dans `webfront/tests-e2e` :

```bash
cd webfront
npm run test:e2e
```

### Client JS – `@obsidiane/auth-client-js`

* Consomme l’API (login, me, refresh, logout, register, reset password) depuis navigateur ou Node/SSR.
* Sources & doc : `packages/auth-client-js`.

### Bundle PHP – `obsidiane/auth-sdk`

* Client HTTP Symfony pour ce service d’authentification.
* Sources & doc : `packages/auth-client-php`.

---

## Bridge Meridiane

Un bridge Angular peut être généré depuis la spec OpenAPI (API Platform) via le Makefile racine.
Le core doit être lancé avec `API_DOCS_ENABLED=1` (spec sur `http://localhost:8000/api/docs.json`).

```bash
make bridge
```

La documentation d’usage et les bonnes pratiques frontend sont dans `@obsidiane/docs/meridiane.md`.

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
