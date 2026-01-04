# Obsidiane Auth - Guide Agent

Deux sous-projets :
- `core/` : backend Symfony 7 + API Platform (FrankenPHP).
- `webfront/` : frontend Angular 21 (Tailwind).

## Bridge Meridiane (obligatoire)
- Le bridge est genere via le `Makefile` (pas d'installation du CLI dans `webfront/`).
- Pre-requis : core en marche avec `API_DOCS_ENABLED=1` (spec sur `http://localhost:8000/api/docs.json`).
- Generation :
  - `make bridge`
- Le bridge genere vit dans `webfront/bridge` (ne pas editer a la main).

## Webfront - bonnes pratiques

### Architecture stricte
- Pattern : `store -> repository -> service -> composant`.
- Angular standalone : `app.config.ts` + `app.routes.ts`, routes feature dans `modules/*/*.routes.ts`.
- **Store** : source de verite (Signals), pas de logique reseau.
- **Repository** : `ResourceFacade`/`BridgeFacade`, sync du store via `tap(...)`.
- **Service** : API `async/await`, parametres par defaut, auto-fetch.
- **Composants** : affichage uniquement, pas de `HttpClient`, pas d'IRI.

### Donnees & fetch
- Pas d'etat local pour les entites : `service.entities()` + selectors.
- `service.entity(iri)` auto-fetch si l'entite manque.
- `service.peekEntity(iri)` lit uniquement le store (pas de fetch).
- `computed()` ne declenche pas de fetch ; `effect()` sert aux effets.

### Routing reactif
- Pas de `route.snapshot.paramMap`.
- Utiliser `toSignal(route.paramMap/queryParamMap, { initialValue: route.snapshot... })` + `effect()`.

### Formulaires
- `effect()` pour reset/hydrate sur changement d'IRI.
- Desactiver le form via `effect` quand `loading || saving`.

### Auth & securite
- Toute communication passe par le bridge (`BridgeFacade` / `ResourceFacade`).
- CSRF stateless : pas de token/header ; protection via CORS + Origin/Referer (MutationSourceVoter).
- `AuthService` expose l'utilisateur courant (Signal) et les actions auth.

### Ressources metier (ce projet)
- `User` : collection `/api/users`, mise a jour des roles via `/api/users/{id}/roles`.
- `InviteUser` : collection `/api/invite_users`.
- `Auth` & `Setup` : endpoints custom (`/api/auth/*`, `/api/setup/admin`).

### Validation avant PR
- `cd webfront && npm run lint && npm run build`

## Backend rapide (core/)
- `cd core && docker compose up -d`
- `cd core && php bin/console doctrine:migrations:migrate`
