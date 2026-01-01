# AGENTS.md (webfront/) — Angular + Tailwind + Bridge

## Rôle de ce dossier
Frontend Angular (ex : Angular 20) avec Tailwind.
L’accès aux données est standardisé via un bridge (ex : `@auth/bridge` ou équivalent).

## Architecture non négociable
Utiliser : `store → repository → service → composant`

### Store (source de vérité)
- Un store par type d’entité.
- La clé du store est l’IRI (string).
- Expose des Signals :
  - `entities()` (collection)
  - `entity(iri)` (unitaire)

### Repository (read model + synchronisation store)
- Fournit les selectors `computed` (endroit unique de “comment lire la donnée”) :
  - `accountByEmail`, `licencesByAccount`, etc.
- Synchronise le store dans `tap(...)` à la réception des données réseau (upsert).
- Si un selector existe : ne pas re-filtrer dans les composants.

### Service (frontière réseau)
- API en `async/await`.
- Porte :
  - construction de query (HttpParams → Query)
  - paramètres par défaut
  - normalisation des erreurs et notifications
  - stratégies de fetch (auto-fetch, peek)
- Aucun HttpParams et aucune gestion d’erreur réseau dans les composants.

### Composants (affichage uniquement)
- Pas d’appels HTTP directs.
- Pas de filtrage/normalisation “ad hoc”.
- Lire les Signals et appeler des méthodes de service.

## Données & fetch : conventions
- Pas d’état local d’entité dans les composants.
  - Utiliser `service.entities()` + `computed(...)` ou des selectors repository.
- Auto-fetch :
  - `service.entity(iri)` lit le store et fetch si `undefined`.
- Peek :
  - `service.peekEntity(iri)` lit uniquement le store (aucun fetch).
- `computed()` doit rester pur (pas de fetch).
- `effect()` réservé aux effets de bord :
  - fetch/reset/navigation/disable.

## IRIs & règles “owner” (comptes)
- Ne jamais utiliser `/api/accounts/me` comme filtre ou pivot UI.
- Résoudre l’IRI réel `/api/accounts/{id}` via AccountsService :
  - `ownerIriFrom(...)`
  - `currentOwnerIri()`
  - `rememberCurrentAccount(...)` (si applicable)

## Routing réactif
- Ne pas baser l’UI sur `route.snapshot.paramMap`.
- Utiliser :
  - `toSignal(route.paramMap, { initialValue: route.snapshot.paramMap })`
  - puis `computed/effect`.

## Formulaires (KISS)
- Clé primaire : `iri` (et `hydratedIri` seulement si nécessaire).
- Patterns :
  - `effect(() => reset form when iri changes)`
  - `effect(() => hydrate when entity available)`
  - désactiver via `effect` lorsque `loading || saving`.

## Anti-patterns (liste noire)
- Pas de `Signal<Signal<...>>`.
- Pas d’outils de préfetch globaux (`inFlight`, `prefetchOnce`).
  - Si besoin, implémenter dans un service avec une sémantique claire.
- Pas de caches supplémentaires (Map) pour des entités : le store sert déjà de cache.
- Éviter `any` et les casts forcés ; préférer des helpers (`extractHttpStatus`, `asRecord`, etc.).

## Erreurs & navigation
- Afficher les erreurs via NotificationService (et un signal d’erreur de page si besoin).
- Normaliser les erreurs HTTP via `extractHttpStatus(error)`.
- Navigation :
  - `void router.navigate(...)` si aucun résultat attendu
  - `await router.navigate(...)` si intentionnel et géré

## Règles de scope (“mon espace” vs admin)
- Pages “Mon espace” : filtrer côté API sur le compte courant (owner).
- Pages admin : chargement global ; ne pas réutiliser des services “mine” sans expliciter le scope.

## Flux d’auth (configuration type)
- Service d’auth externe : `${authApiBaseUrl}`.
- authGuard :
  - `/auth/me`
  - refresh sur 401
  - heartbeat (ex : toutes les 10s)
  - redirection vers `${authApiBaseUrl}/login` si session invalide
- `AuthUsersService.me` : signal de l’utilisateur connecté (hors stores d’entités).

## Bridge / types générés
- Le bridge est l’unique source de :
  - modèles typés
  - utilitaires de requêtes
  - utilitaires Mercure/SSE (si activés)
- Si le contrat backend change : régénérer/mettre à jour le bridge puis corriger jusqu’à compilation verte.

À compléter et maintenir exact :
- Nom du package bridge : `@auth/bridge` (généré via `@obsidiane/meridiane`).
- Commande de génération : `make bridge` (mode `meridiane generate`, depuis la racine).
- Chemin de sortie : `webfront/bridge`.

## Commandes canoniques (dev)
Depuis `webfront/` :
- Installer :
  - `npm ci`
- Démarrer :
  - `npm run start`
- Validation avant PR :
  - `npm run lint`
  - `npm run build`
