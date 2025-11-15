# Obsidiane Auth – Client JS

SDK JavaScript minimal pour consommer l’API Obsidiane Auth depuis un navigateur ou un environnement Node/SSR.

Il gère :
- les appels `fetch` avec `credentials: 'include'` pour envoyer/recevoir les cookies `__Secure-at` / `__Host-rt` ;
- la récupération des tokens CSRF via `/api/auth/csrf/{id}` ;
- les opérations courantes : `login`, `me`, `refresh`, `logout`, `register`, `passwordRequest`, `passwordReset`.

## Installation

Le SDK est publié sur le registre public npm :

```bash
npm install @obsidiane/auth
```

ou

```bash
yarn add @obsidiane/auth
```

## Utilisation

```ts
import { AuthClient } from '@obsidiane/auth';

const auth = new AuthClient({
  baseUrl: 'https://auth.example.com', // ou '' si même origine
});

// Exemple: login + me
const csrf = await auth.csrf('authenticate');
await auth.login('user@example.com', 'Secret123!', csrf);
const { user } = await auth.me<{ user: { id: string } }>();
```

### Réinitialisation de mot de passe

Le flow repose sur les routes UI `/reset-password` :

- `passwordRequest(email, csrf)` envoie un POST JSON sur `/reset-password` avec `{ email }`
- `passwordReset(token, password, csrf)` envoie un POST JSON sur `/reset-password/reset`

Les identifiants CSRF associés sont `password_request` et `password_reset`, à récupérer via `/api/auth/csrf/{id}`.

Pour une description complète des flows (UI, cookies, CSRF, reset, logout), voir le `docs/USER_GUIDE.md` du projet principal.
