# Obsidiane Auth – Client JS

SDK JavaScript minimal pour consommer l’API **Obsidiane Auth** dans n’importe quel framework front (React, Angular, Vue, Svelte, etc.) exécuté dans un navigateur.

Il gère automatiquement :

- les appels `fetch` avec `credentials: 'include'` pour envoyer / recevoir les cookies `__Secure-at` / `__Host-rt` ;
- les opérations courantes : `login`, `me`, `refresh`, `logout`, `register`, `passwordRequest`, `passwordReset`.

---

## Installation

Le SDK est publié sur npm :

```bash
npm install @obsidiane/auth-sdk
# ou
yarn add @obsidiane/auth-sdk
````

---

## Démarrage rapide

```ts
import { AuthClient } from '@obsidiane/auth-sdk';

const auth = new AuthClient({
  baseUrl: 'https://auth.example.com', // requis : URL racine du service d’auth
});

// 1) Login (le SDK génère automatiquement un token CSRF stateless et l'envoie dans l'en-tête `csrf-token`)
await auth.login('user@example.com', 'Secret123!');

// 3) Récupérer l'utilisateur courant
const { user } = await auth.me();
console.log(user.email);

// 4) Le reste des appels (refresh, logout, reset password, etc.) restent pilotés par le SDK.
```

Le client :

* ajoute automatiquement `credentials: 'include'` ;
* n’expose jamais directement les cookies ni les tokens JWT côté JS ;
* se contente de piloter les appels HTTP vers le service Obsidiane Auth.

---

## Modèles d’entités (types)

Le SDK expose quelques interfaces utiles qui reflètent les entités / payloads principaux tels qu’ils apparaissent dans l’API et la documentation OpenAPI :

```ts
export interface AuthUser {
  id: number;
  email: string;
  roles: string[];
  isEmailVerified?: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  exp: number;
}

export interface RegisterResponse {
  user: AuthUser;
}

export interface InviteStatusResponse {
  status: 'INVITE_SENT' | string;
}

export interface InviteResource {
  id: number;
  email: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
}
```

Pour les usages JSON‑LD (sans Hydra, API Platform v4), le SDK expose également deux helpers génériques :

```ts
export interface JsonLdMeta {
  '@context'?: string | Record<string, unknown>;
  '@id'?: string;
  '@type'?: string | string[];
}

export type Item<T> = T & JsonLdMeta;

export interface Collection<T> extends JsonLdMeta {
  items: Array<Item<T>>;
  totalItems?: number;
}
```

Ces types permettent de représenter les métadonnées JSON‑LD autour de vos entités (par exemple `Item<AuthUser>` ou `Collection<InviteResource>`), sans exposer de clés spécifiques au format interne.

---

## API du client

### Construction

```ts
const auth = new AuthClient({
  baseUrl: 'https://auth.example.com', // requis (sans trailing slash)
  fetch: customFetch,                  // optionnel (sinon fetch global)
  defaultHeaders: { 'X-App': 'my-ui' },
  timeoutMs: 10000,                    // optionnel, abort via AbortController
  csrfTokenGenerator: () => 'token',   // optionnel (par défaut, utilise crypto ou fallback SSR-safe)
  onCsrfRejected: async ({ response, path }) => {
    // Hook optionnel appelé avant le retry auto sur un 403 CSRF
    console.warn('CSRF rejeté sur', path, response.status);
  },
});
```

`baseUrl` doit pointer vers la racine de ton service d’authentification. Les appels ajoutent toujours `credentials: 'include'`.

### Gestion CSRF (retry)

Les mutations envoient un token CSRF stateless généré côté client. En cas de réponse `403` CSRF, le SDK regénère automatiquement un nouveau token et réessaie une fois. Via l’option `onCsrfRejected`, tu peux brancher un hook (logging/observabilité) ou retourner une `Response` custom pour bypasser le retry.

### Génération de token CSRF

Le helper exporté `generateCsrfToken()` utilise d’abord `crypto.randomUUID` / `crypto.getRandomValues` quand ils sont disponibles (navigateurs, Node 18+). En environnement SSR/ESM sans crypto, un fallback pseudo-aléatoire est utilisé pour rester compatible – surchargeable via l’option `csrfTokenGenerator`.

### Gestion des erreurs

Les erreurs réseau/API lèvent un `AuthClientError` (exporté par le SDK) avec les propriétés suivantes :

```ts
import { AuthClient, AuthClientError } from '@obsidiane/auth-sdk';

try {
  await auth.inviteUser('invitee@example.com');
} catch (e) {
  const err = e as AuthClientError;
  console.error(err.status, err.code, err.details);
}
```

### `login(email, password)`

Effectue un login et laisse le serveur poser les cookies (`__Secure-at`, `__Host-rt`).

```ts
await auth.login('user@example.com', 'Secret123!');
```

* Appelle `POST /api/auth/login` avec un token stateless généré côté client dans l’en-tête `csrf-token`.
* En cas de succès, les cookies sont stockés par le navigateur.

---

### `me()`

Récupère l’utilisateur courant.

```ts
const me = await auth.me();
console.log(me.user.email, me.user.roles);
```

* Appelle `GET /api/auth/me`.
* Utilise le cookie `__Secure-at` automatiquement (via `credentials: 'include'`).

### `refresh()`

Rafraîchit le token d’accès.

```ts
await auth.refresh();
```

* Appelle `POST /api/auth/refresh`.
* Utilise automatiquement le cookie `__Host-rt`.
* Ne nécessite pas de CSRF.

---

### `logout()`

Effectue un logout complet (invalidations côté serveur + expiration cookies).

```ts
await auth.logout();
```

* Appelle `POST /api/auth/logout` avec un token stateless généré côté client dans l’en-tête `csrf-token`.

---

### `register({ email, password })`

Crée un nouvel utilisateur.

```ts
await auth.register({
  email: 'user@example.com',
  password: 'Secret123!',
});
```

* Appelle `POST /api/auth/register`.
* Déclenche l’envoi d’un email de vérification (`/verify-email`) côté service d’authentification.
* La signature attend explicitement un objet `{ email, password }` (voir type `RegisterPayload`), aligné sur l’API backend.

---

### Invitation administrateur

#### `inviteUser(email)`

Invite (ou ré-invite) un utilisateur, endpoint réservé aux administrateurs (`ROLE_ADMIN`).

```ts
await auth.inviteUser('invitee@example.com'); // -> { status: 'INVITE_SENT' }
```

* Appelle `POST /api/auth/invite` avec un token CSRF stateless.
* Si le compte existe déjà et est actif, l’API renvoie `409` avec `{ error: 'EMAIL_ALREADY_USED', details: { email: 'EMAIL_ALREADY_USED' } }`.
  Exemple de gestion côté UI :
  ```ts
  try {
    await auth.inviteUser('invitee@example.com');
  } catch (e: any) {
    if (e.code === 'EMAIL_ALREADY_USED') {
      // afficher “ce compte est déjà actif”
    } else {
      throw e;
    }
  }
  ```
* Si une invitation active existe déjà pour cet utilisateur, l’API ne régénère pas le token et renvoie simplement un nouvel email (fonction “resend”).

#### `completeInvite(token, password, confirmPassword?)`

Complète une invitation à partir du lien reçu par email.

```ts
await auth.completeInvite('invitation-token', 'Secret123!');
```

* Appelle `POST /api/auth/invite/complete` avec `{ token, password, confirmPassword }`.
* Retourne le même type de payload qu’une inscription (`RegisterResponse`).

---

### Réinitialisation de mot de passe

Le flow repose sur l’UI `/reset-password` du service principal, mais le client fournit des helpers HTTP pour les appels API :

#### `passwordRequest(email)`

Envoie l’email de réinitialisation.

```ts
await auth.passwordRequest('user@example.com');
```

* Appelle `POST /api/auth/password/forgot` avec `{ email }`.
* Réponse côté API : `202 { status: 'OK' }` (pas de fuite sur l’existence du compte).

#### `passwordReset(token, password)`

Soumet le nouveau mot de passe.

```ts
await auth.passwordReset('resetTokenReçuParEmail', 'NewSecret123!');
```

* Appelle `POST /api/auth/password/reset` avec `{ token, password }`.
* Invalide les sessions actives de l’utilisateur (côté service).

---

## Helpers API Platform

En complément des endpoints “auth”, le SDK fournit des helpers pour consommer les ressources exposées par API Platform (`User`, `InviteUser`, …), en utilisant le format JSON-LD (`Accept: application/ld+json`). Les métadonnées JSON‑LD sont gérées côté SDK, sans exposer de détails supplémentaires aux consommateurs.

### `listUsers()`

Liste les utilisateurs via `GET /api/users` :

```ts
const users = await auth.listUsers(); // AuthUser[]
```

### `getUser(id)`

Récupère un utilisateur précis via `GET /api/users/{id}` :

```ts
const user = await auth.getUser(1); // AuthUser
```

### `deleteUser(id)`

Supprime un utilisateur via `DELETE /api/users/{id}` :

```ts
await auth.deleteUser(1);
```

### `listInvites()`

Liste les invitations connues (`InviteUser`) via `GET /api/invite_users` :

```ts
const invites = await auth.listInvites(); // InviteResource[]
```

### `getInvite(id)`

Récupère une invitation précise via `GET /api/invite_users/{id}` :

```ts
const invite = await auth.getInvite(1); // InviteResource
```

---

## Notes d’utilisation

* **Cookies & CORS**

    * Pense à configurer le service Obsidiane Auth avec `CORS` et `ALLOW_CREDENTIALS` activés si ton front est sur un autre domaine.
    * Côté front, aucune manipulation de JWT : les cookies restent gérés par le navigateur.

* **Environnements SSR / Node**

    * Le client repose sur `fetch`.
    * En Node, tu peux utiliser un polyfill (`node-fetch`, `undici`, etc.) si ton runtime ne fournit pas `fetch` nativement.
// 4) Token CSRF si tu fais un appel custom
import { generateCsrfToken } from '@obsidiane/auth-sdk';
const csrf = generateCsrfToken();
