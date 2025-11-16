/*
 Lightweight JS SDK for Obsidiane Auth
 - Uses fetch with credentials: 'include' so cookies flow as required
 - Expects caller to provide a CSRF token when needed
 - Types are generated from OpenAPI into ./types.gen.ts by the prepublishOnly script
*/

export type FetchLike = typeof fetch;

export interface AuthClientOptions {
  baseUrl?: string; // default: '' (relative)
  fetch?: FetchLike; // default: globalThis.fetch
}

export class AuthClient {
  private readonly baseUrl: string;
  private readonly doFetch: FetchLike;

  constructor(opts: AuthClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? '').replace(/\/$/, '');
    this.doFetch = opts.fetch ?? (globalThis.fetch as FetchLike);
    if (!this.doFetch) throw new Error('No fetch implementation available');
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  // Utility to build headers with optional CSRF token
  private headers(csrf?: string): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (csrf) h['csrf-token'] = csrf;
    return h;
  }

  // GET /api/auth/me
  async me<T = unknown>(): Promise<T> {
    const res = await this.doFetch(this.url('/api/auth/me'), {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`me_failed:${res.status}`);
    return (await res.json()) as T;
  }

  // POST /api/login — CSRF required
  async login<T = unknown>(email: string, password: string, csrf: string): Promise<T> {
    const res = await this.doFetch(this.url('/api/login'), {
      method: 'POST',
      credentials: 'include',
      headers: this.headers(csrf),
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(`login_failed:${res.status}`);
    return (await res.json()) as T;
  }

  // POST /api/token/refresh — cookie-based, CSRF optional
  async refresh<T = unknown>(csrf?: string): Promise<T> {
    const res = await this.doFetch(this.url('/api/token/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: this.headers(csrf),
    });
    if (!res.ok) throw new Error(`refresh_failed:${res.status}`);
    return (await res.json()) as T;
  }

  // POST /api/auth/logout — CSRF required
  async logout(csrf: string): Promise<void> {
    const res = await this.doFetch(this.url('/api/auth/logout'), {
      method: 'POST',
      credentials: 'include',
      headers: this.headers(csrf),
    });
    if (!res.ok && res.status !== 204) throw new Error(`logout_failed:${res.status}`);
  }

  // POST /api/auth/register — CSRF required
  async register<T = unknown>(input: Record<string, unknown>, csrf: string): Promise<T> {
    const res = await this.doFetch(this.url('/api/auth/register'), {
      method: 'POST',
      credentials: 'include',
      headers: this.headers(csrf),
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`register_failed:${res.status}`);
    return (await res.json()) as T;
  }

  // POST /reset-password — CSRF required (password_request)
  async passwordRequest<T = unknown>(email: string, csrf: string): Promise<T> {
    const res = await this.doFetch(this.url('/reset-password'), {
      method: 'POST',
      credentials: 'include',
      headers: this.headers(csrf),
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error(`password_request_failed:${res.status}`);
    return (await res.json()) as T;
  }

  // POST /reset-password/reset — CSRF required (password_reset)
  async passwordReset(token: string, password: string, csrf: string): Promise<void> {
    const res = await this.doFetch(this.url('/reset-password/reset'), {
      method: 'POST',
      credentials: 'include',
      headers: this.headers(csrf),
      body: JSON.stringify({ token, password }),
    });
    if (!res.ok && res.status !== 204) throw new Error(`password_reset_failed:${res.status}`);
  }
}

// Stateless CSRF: callers are expected to generate a cryptographically
// secure random token per request and pass it to SDK methods. This SDK
// no longer fetches CSRF tokens from the backend.
