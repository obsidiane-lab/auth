# @obsidiane/auth-sdk – SDK JS navigateur pour Obsidiane Auth

SDK JavaScript/TypeScript pour consommer l’API Obsidiane Auth depuis un navigateur :

- gère automatiquement les **cookies** (`__Secure-at`, `__Host-rt`) via `fetch` + `credentials: 'include'` ;
- génère et envoie un **token CSRF stateless** dans l’en‑tête `csrf-token` pour les endpoints sensibles ;
- expose des **sous‑clients dédiés** (`auth`, `users`, `invites`, `setup`) avec une méthode par endpoint ;
- fournit des **types TypeScript** et une gestion d’erreurs structurée (`ApiError`).

Ce SDK est conçu pour être utilisé **côté navigateur uniquement** (pas de Node côté serveur).

---

## 1. Installation

```bash
npm install @obsidiane/auth-sdk
# ou
yarn add @obsidiane/auth-sdk
```

Le package est publié en **ESM** et inclut les définitions TypeScript (`.d.ts`).

### Build (depuis le dépôt monorepo)

Depuis la racine du projet `auth` :

```bash
cd packages/auth-client-js
npm install        # si nécessaire
npm run build      # génère dist/*
```

ou via un script dans le `package.json` racine :

```json
{
  "scripts": {
    "auth-sdk:build": "npm --prefix packages/auth-client-js run build"
  }
}
```

---

## 2. Concepts clés

### 2.1 Cookies & sessions JWT

- L’API Auth émet deux cookies :
  - `__Secure-at` : access token (JWT), SameSite `Lax`, partagé ;
  - `__Host-rt` : refresh token (Gesdinet), SameSite `Strict`, host-only.
- Le SDK **ne manipule pas directement** ces tokens :
  - ils restent dans les cookies HTTP Only ;
  - les appels se font toujours avec `credentials: 'include'`.

### 2.2 CSRF stateless

- Aucun token CSRF n’est généré par le backend.
- Le SDK doit :
  - générer un jeton aléatoire **par requête sensible** ;
  - l’envoyer dans l’en‑tête `csrf-token`.
- Ce comportement est intégré dans le client HTTP :
  - `csrf: true` dans les options de requête → génération automatique d’un token ;
  - `csrf: 'valeur'` → utilisation d’un token fourni ;
  - `csrf: false/undefined` → aucun header CSRF.

### 2.3 Base URL & CORS

- `baseUrl` doit pointer vers la racine d’Obsidiane Auth, par ex. :
  - `https://auth.example.com`
  - `http://localhost:8000`
- Côté navigateur, pensez à :
  - autoriser l’origine dans `ALLOWED_ORIGINS` côté backend ;
  - toujours activer `credentials: 'include'` (géré par le SDK).

---

## 3. AuthClient – configuration de base

Le point d’entrée du SDK est la classe `AuthClient`.

```ts
import { AuthClient } from '@obsidiane/auth-sdk';

const auth = new AuthClient({
  baseUrl: 'https://auth.example.com',
});
```

### 3.1 Options disponibles

```ts
type AuthClientOptions = {
  baseUrl: string;                     // requis
  defaultHeaders?: HeadersInit;        // en-têtes appliqués à toutes les requêtes
  credentials?: RequestCredentials;    // 'include' (défaut), 'same-origin', 'omit'
  csrfHeaderName?: string;             // 'csrf-token' par défaut
  csrfTokenGenerator?: () => string;   // pour surcharger la génération CSRF
  fetchImpl?: typeof fetch;            // pour tests ou environnements custom
};
```

- `baseUrl` : URL du service d’authentification.
- `defaultHeaders` : ex. `{'X-App': 'my-frontend'}`.
- `credentials` : par défaut `'include'` pour envoyer/recevoir les cookies JWT.
- `csrfHeaderName` : à ne changer que si le backend n’utilise pas `csrf-token`.
- `csrfTokenGenerator` : permet d’imposer votre propre stratégie de génération.
- `fetchImpl` : utile pour :
  - mocker `fetch` dans des tests ;
  - injecter une version instrumentée de `fetch`.

---

## 4. Sous-clients & endpoints

`AuthClient` expose plusieurs sous‑clients pour regrouper les endpoints par domaine.

```ts
const client = new AuthClient({ baseUrl: 'https://auth.example.com' });

client.auth;    // endpoints /api/auth/*
client.users;   // endpoints /api/users*
client.invites; // endpoints /api/invite_users*
client.setup;   // endpoint /api/setup/admin
```

Les types suivants sont exportés pour typer vos appels :

```ts
import type {
  User,
  Invite,
  LoginResponse,
  MeResponse,
  RegisterInput,
  RegisterResponse,
  RefreshResponse,
  PasswordForgotResponse,
  InviteStatusResponse,
  CompleteInviteResponse,
  InitialAdminInput,
  InitialAdminResponse,
} from '@obsidiane/auth-sdk';
```

### 4.1 Auth – `client.auth`

Endpoints principaux :

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/refresh`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `POST /api/auth/password/forgot`
- `POST /api/auth/password/reset`
- `POST /api/auth/invite`
- `POST /api/auth/invite/complete`

Méthodes exposées :

```ts
// Profil courant
const me: MeResponse = await client.auth.me();

// Login (CSRF requis)
const { user, exp }: LoginResponse = await client.auth.login(email, password);

// Refresh silencieux (CSRF non requis, mais possible)
const refresh: RefreshResponse = await client.auth.refresh();

// Logout (CSRF requis)
await client.auth.logout();

// Inscription (CSRF requis)
const registration: RegisterResponse = await client.auth.register({
  email: 'user@example.com',
  password: 'Secret123!',
});

// Demande de reset (CSRF requis)
const forgot: PasswordForgotResponse = await client.auth.requestPasswordReset('user@example.com');

// Reset password (CSRF requis)
await client.auth.resetPassword('<reset-token>', 'NewSecret123!');

// Invitation (admin, CSRF requis)
const inviteStatus: InviteStatusResponse = await client.auth.inviteUser('invitee@example.com');

// Compléter une invitation (public, CSRF requis)
const completed: CompleteInviteResponse = await client.auth.completeInvite('token', 'Secret123!');
```

### 4.2 Setup initial – `client.setup`

Endpoint :

- `POST /api/setup/admin`

```ts
const input: InitialAdminInput = {
  email: 'admin@example.com',
  password: 'Secret123!',
};

const created: InitialAdminResponse = await client.setup.createInitialAdmin(input);
```

Ce flux n’est disponible que tant qu’aucun utilisateur n’existe dans la base.

### 4.3 Users – `client.users`

Endpoints Api Platform :

- `GET /api/users`
- `GET /api/users/{id}`
- `DELETE /api/users/{id}`

```ts
// Liste d’utilisateurs (admin uniquement)
const users: User[] = await client.users.list();

// Détail d’un utilisateur
const user: User = await client.users.get(1);

// Suppression
await client.users.delete(42);
```

### 4.4 Invites – `client.invites`

Endpoints Api Platform :

- `GET /api/invite_users`
- `GET /api/invite_users/{id}`

```ts
import type { Invite } from '@obsidiane/auth-sdk';

const invites: Invite[] = await client.invites.list();
const invite: Invite = await client.invites.get(invites[0].id);
```

---

## 5. Gestion des erreurs

Toutes les erreurs HTTP (codes 4xx/5xx) sont mappées sur une exception `ApiError` :

```ts
import { ApiError } from '@obsidiane/auth-sdk';

try {
  await client.auth.register({ email, password });
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Status HTTP :', error.status);
    console.error('Code métier :', error.errorCode);
    console.error('Détails :', error.details);
    console.error('Payload brut :', error.payload);
  } else {
    console.error('Erreur inattendue :', error);
  }
}
```

`ApiError` reflète la structure d’erreur du backend :

- `status` : code HTTP ;
- `errorCode` : champ `error` du payload (`EMAIL_ALREADY_USED`, `INVALID_REGISTRATION`, etc.) ;
- `details` : champ `details` lorsque présent ;
- `payload` : payload complet retourné par l’API.

Un alias `AuthSdkError` est également exporté pour des usages plus génériques.

---

## 6. Intégration front – exemples

### 6.1 Vanilla JS / TS

```ts
import { AuthClient } from '@obsidiane/auth-sdk';

const client = new AuthClient({
  baseUrl: 'https://auth.example.com',
});

async function handleLogin(email: string, password: string) {
  const { user } = await client.auth.login(email, password);
  console.log('Connecté en tant que', user.email);
}
```

### 6.2 React (hook simple)

```ts
import { useState, useEffect } from 'react';
import { AuthClient, ApiError, type MeResponse } from '@obsidiane/auth-sdk';

const client = new AuthClient({ baseUrl: 'https://auth.example.com' });

export function useCurrentUser() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;

    client.auth
      .me()
      .then((res) => {
        if (!cancelled) {
          setData(res);
        }
      })
      .catch((err) => {
        if (!cancelled && err instanceof ApiError && err.status === 401) {
          setData(null);
        } else if (!cancelled) {
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
```

### 6.3 Refresh silencieux

```ts
async function scheduleRefresh(client: AuthClient, exp: number) {
  const now = Date.now() / 1000;
  const delaySeconds = Math.max(exp - now - 30, 10); // rafraîchit 30s avant l’expiration

  setTimeout(async () => {
    const { exp: newExp } = await client.auth.refresh();
    await scheduleRefresh(client, newExp);
  }, delaySeconds * 1000);
}

const { exp } = await client.auth.login('user@example.com', 'Secret123!');
scheduleRefresh(client, exp);
```

---

## 7. Utilisation avancée

### 7.1 Générer un token CSRF compatible

Dans la plupart des cas, vous n’avez pas besoin d’appeler cela directement (les méthodes du SDK s’en chargent). Pour des appels HTTP personnalisés, vous pouvez générer un token compatible :

```ts
import { AuthClient } from '@obsidiane/auth-sdk';

const client = new AuthClient({ baseUrl: 'https://auth.example.com' });
const csrf = client.generateCsrfToken();

await fetch('https://auth.example.com/api/custom/endpoint', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'csrf-token': csrf,
  },
  body: JSON.stringify({ foo: 'bar' }),
});
```

### 7.2 Surcharger `fetch`

Pour instrumenter toutes les requêtes du SDK (logs, tracing, mocking) :

```ts
const instrumentedFetch: typeof fetch = async (input, init) => {
  const start = performance.now();
  const response = await fetch(input, init);
  const duration = performance.now() - start;

  console.debug('Auth SDK request', { input, status: response.status, duration });

  return response;
};

const client = new AuthClient({
  baseUrl: 'https://auth.example.com',
  fetchImpl: instrumentedFetch,
});
```

### 7.3 Surcharger la génération CSRF

```ts
const client = new AuthClient({
  baseUrl: 'https://auth.example.com',
  csrfTokenGenerator: () => myCustomRandomHex(32),
});
```

---

## 8. Bonnes pratiques de sécurité côté front

- **Ne stockez jamais** les JWT dans `localStorage` ou `sessionStorage` :
  - laissez le backend gérer les cookies `HttpOnly` ;
  - utilisez toujours `credentials: 'include'` (géré par le SDK).
- Générer un **token CSRF par requête** sensible (le SDK le fait pour toutes ses méthodes).
- Garder `baseUrl` cohérent avec la politique CORS (`ALLOWED_ORIGINS`) du backend.
- En production :
  - servir le frontend en HTTPS ;
  - s’assurer que les cookies `Secure` sont bien activés.

Pour le détail fonctionnel des endpoints (payloads, codes d’erreurs métier, flows complets), reportez‑vous au `README.md` du projet principal Obsidiane Auth. Ce SDK en est un simple wrapper typé, respectant les mêmes conventions (CSRF stateless, JWT + refresh, allowlist de redirection). 

