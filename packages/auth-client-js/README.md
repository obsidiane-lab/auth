# @obsidiane/auth-client-js

Obsidiane Auth API Client for Angular/TypeScript.

A lightweight SDK for interacting with the Obsidiane Auth service, featuring:
- **Bridge from Meridiane**: Auto-generated HTTP client, facades, and TypeScript models from OpenAPI spec
- **CSRF Protection**: Stateless token generation and persistence with Angular HttpClient interceptor
- **Zero runtime dependencies**: Uses native browser APIs and Angular's built-in HTTP client

## Installation

```bash
npm install @obsidiane/auth-client-js
```

## Quick Start

### 1. Setup in your Angular app

```typescript
// app.config.ts
import { provideBridge } from '@obsidiane/auth-client-js';
import { CsrfInterceptor } from '@obsidiane/auth-client-js/csrf';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    // Provide the Meridiane bridge (HTTP client + facades)
    provideBridge({
      baseUrl: 'http://localhost:9000',
    }),

    // Add CSRF interceptor to all HTTP requests
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CsrfInterceptor,
      multi: true,
    },
  ],
};
```

### 2. Use in your services

```typescript
import { Injectable, inject } from '@angular/core';
import { FacadeFactory } from '@obsidiane/auth-client-js';
import type { UserUserRead } from '@obsidiane/auth-client-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly factory = inject(FacadeFactory);
  private readonly users = this.factory.create<UserUserRead>({
    url: '/api/users',
  });

  getUsers() {
    return this.users.getCollection$();
  }

  getUser(id: string) {
    return this.users.get$(id);
  }
}
```

## API Reference

### Bridge Exports (from Meridiane)

The bridge provides:

#### **FacadeFactory**
Create resource facades for CRUD operations:

```typescript
const facade = factory.create<MyResource>({
  url: '/api/resources',
});

// Collection operations
facade.getCollection$({ page: 1, itemsPerPage: 20 })

// Item operations
facade.get$(id)
facade.post$(item)
facade.patch$(id, partialItem)
facade.delete$(id)
```

#### **BridgeFacade**
Low-level HTTP client for custom endpoints:

```typescript
const bridge = inject(BridgeFacade);

// Custom GET
bridge.get$<MyResponse>('/api/custom-endpoint')

// Custom POST
bridge.post$<MyResponse>('/api/custom-endpoint', { payload })
```

#### **Models**
TypeScript types for all API resources:

```typescript
import type {
  UserUserRead,
  Auth,
  InviteUserInviteRead,
  // ... all other models
} from '@obsidiane/auth-client-js';
```

### CSRF Utilities

Import directly from the package:

```typescript
import {
  generateCsrfToken,
  getCsrfTokenFromCookie,
  persistCsrfCookie,
  getOrGenerateCsrfToken,
  clearCsrfCookie,
} from '@obsidiane/auth-client-js/csrf';

// Generate a new token
const token = generateCsrfToken();

// Get existing token or generate new one
const token = getOrGenerateCsrfToken();

// Retrieve from cookie
const token = getCsrfTokenFromCookie();

// Store in cookie
persistCsrfCookie(token);

// Clear from cookie
clearCsrfCookie();
```

## How It Works

### Bridge Layer (Meridiane)

The bridge is auto-generated from the OpenAPI spec (`/api/docs.json`) using Meridiane. It includes:

- **HTTP Client**: Optimized fetch wrapper with automatic retries and deduplication
- **Facades**: Resource-based API for common CRUD operations
- **Models**: TypeScript interfaces for all API request/response types
- **Interceptors**: Built-in handling for headers, errors, and single-flight requests

### CSRF Layer

On top of the bridge, we add a thin CSRF layer:

1. **Token Generation**: Uses `crypto.getRandomValues()` (with fallback)
2. **Token Persistence**: Stores in secure cookie (`__Host-csrf-token_*`)
3. **Automatic Injection**: Angular HttpClient interceptor adds token to POST/PUT/PATCH/DELETE requests
4. **Double-Submit Pattern**: Token sent both as header and cookie

## Development

### Regenerate from OpenAPI

The bridge is regenerated from the backend OpenAPI spec:

```bash
# From project root
make sdk-npm

# Or manually
npx meridiane generate "@obsidiane/auth-client-js" \
  --spec http://localhost:9000/api/docs.json \
  --formats "application/ld+json"
```

### Build

```bash
npm run build
# Output: ./dist/
```

### Publish

```bash
npm publish
```

## Migration from Old SDK

The old SDK (`packages/auth-client-js.backup/`) had 758 lines of custom HTTP client code. This new version:

- **Removes**: Custom HTTP client, request builders, response decoders
- **Keeps**: CSRF protection logic
- **Adds**: Meridiane bridge for consistency with the main app

The API remains similar but cleaner:

```typescript
// Old way (custom client)
import { AuthClient } from '@obsidiane/auth-client-js';
const client = new AuthClient({ baseUrl: 'http://localhost:9000' });
client.auth.login(email, password);

// New way (Meridiane bridge + CSRF)
import { BridgeFacade } from '@obsidiane/auth-client-js';
const bridge = inject(BridgeFacade);
bridge.post$('/api/auth/login', { email, password });
```

## Architecture

```
@obsidiane/auth-client-js
├── Bridge (Meridiane-generated)
│   ├── HTTP client (fetch wrapper)
│   ├── Facades (FacadeFactory, BridgeFacade)
│   ├── Models (TypeScript interfaces)
│   └── Interceptors
│
└── CSRF Layer (manual)
    ├── Token generation
    ├── Cookie persistence
    └── Angular HttpClient interceptor
```

## License

MIT
