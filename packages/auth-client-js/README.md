# Obsidiane Auth – Client JS

SDK JavaScript minimal pour consommer l’API **Obsidiane Auth** dans n’importe quel framework front (React, Angular, Vue, Svelte, etc.) exécuté dans un navigateur.

Il gère automatiquement :

- les appels `fetch` avec `credentials: 'include'` pour envoyer / recevoir les cookies `__Secure-at` / `__Host-rt` ;
- les opérations courantes : `login`, `me`, `refresh`, `logout`, `register`, `passwordRequest`, `passwordReset`, `listUsers`, `getUser`.

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
  baseUrl: 'https://auth.example.com', // ou '' si même origine
});

// 1) Login (le SDK génère automatiquement un token CSRF stateless et l'envoie dans l'en-tête `csrf-token`)
await auth.login('user@example.com', 'Secret123!');

// 3) Récupérer l'utilisateur courant
const { user } = await auth.me<{ user: { id: number; email: string } }>();
console.log(user.email);

// 4) Récupérer la liste des utilisateurs (admin)
const users = await auth.listUsers<{ 'hydra:member': Array<{ id: number; email: string }> }>({
  itemsPerPage: 20,
});
for (const u of users['hydra:member']) {
  console.log(u.email);
}
```

Le client :

* ajoute automatiquement `credentials: 'include'` ;
* n’expose jamais directement les cookies ni les tokens JWT côté JS ;
* se contente de piloter les appels HTTP vers le service Obsidiane Auth.

---

## API du client

### Construction

```ts
const auth = new AuthClient({
  baseUrl: 'https://auth.example.com', // optionnel si même origine
});
```

`baseUrl` doit pointer vers la racine de ton service d’authentification (sans trailing slash).

### `login(email, password)`

Effectue un login et laisse le serveur poser les cookies (`__Secure-at`, `__Host-rt`).

```ts
await auth.login('user@example.com', 'Secret123!');
```

* Appelle `POST /api/auth/login` avec un token stateless généré côté client dans l’en-tête `csrf-token`.
* En cas de succès, les cookies sont stockés par le navigateur.

---

### `me<T>()`

Récupère l’utilisateur courant.

```ts
const me = await auth.me<{ user: { id: number; email: string; roles: string[] } }>();
console.log(me.user.email, me.user.roles);
```

* Appelle `GET /api/auth/me`.
* Utilise le cookie `__Secure-at` automatiquement (via `credentials: 'include'`).

---

### `listUsers(params?)`

Récupère la collection d'utilisateurs (ROLE_ADMIN requis côté API).

```ts
const users = await auth.listUsers<{ 'hydra:member': Array<{ id: number; email: string }> }>({
  itemsPerPage: 50,
});
for (const user of users['hydra:member']) {
  console.log(user.id, user.email);
}
```

* Appelle `GET /api/users` (via API Platform).
* Supporte des paramètres de pagination / filtrage (ex. `itemsPerPage`, `page`, etc.).

---

### `getUser(id)`

Récupère un utilisateur par son identifiant.

```ts
const user = await auth.getUser<{ id: number; email: string; displayName: string }>(1);
console.log(user.email, user.displayName);
```

* Appelle `GET /api/users/{id}`.
* Nécessite les droits appropriés côté API (`ROLE_ADMIN` ou voteur `USER_READ`).

---

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

### `register(email, password, displayName)`

Crée un nouvel utilisateur.

```ts
await auth.register(
  'user@example.com',
  'Secret123!',
  'John Doe',
);
```

* Appelle `POST /api/auth/register`.
* Déclenche l’envoi d’un email de vérification (`/verify-email`) côté service d’authentification.

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

## Notes d’utilisation

* **Cookies & CORS**

    * Pense à configurer le service Obsidiane Auth avec `CORS` et `ALLOW_CREDENTIALS` activés si ton front est sur un autre domaine.
    * Côté front, aucune manipulation de JWT : les cookies restent gérés par le navigateur.

* **Environnements SSR / Node**

    * Le client repose sur `fetch`.
    * En Node, tu peux utiliser un polyfill (`node-fetch`, `undici`, etc.) si ton runtime ne fournit pas `fetch` nativement.
