/*
 Lightweight JS SDK for Obsidiane Auth
 - Uses fetch with credentials: 'include' so cookies flow as required
 - Gère automatiquement les tokens CSRF stateless (header `csrf-token` + cookie double-submit)
 - Types sont générés depuis OpenAPI dans ./types.gen.ts par le script prepublishOnly
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

  private generateCsrfToken(): string {
    if (typeof globalThis.crypto !== 'undefined' && 'getRandomValues' in globalThis.crypto) {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    }

    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  private setDoubleSubmitCookie(token: string): void {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const isSecure = window.location.protocol === 'https:';
    const baseName = (isSecure ? '__Host-' : '') + 'csrf-token';
    const cookieName = `${baseName}_${token}`;

    const attributes = ['path=/', 'SameSite=Strict'];

    if (isSecure) {
      attributes.push('Secure');
    }

    document.cookie = `${cookieName}=csrf-token; ${attributes.join('; ')}`;
  }

  private buildCsrfHeaders(): Record<string, string> {
    const token = this.generateCsrfToken();
    this.setDoubleSubmitCookie(token);
    return this.headers(token);
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
  async login<T = unknown>(email: string, password: string): Promise<T> {
    const res = await this.doFetch(this.url('/api/login'), {
      method: 'POST',
      credentials: 'include',
      headers: this.buildCsrfHeaders(),
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
  async logout(): Promise<void> {
    const res = await this.doFetch(this.url('/api/auth/logout'), {
      method: 'POST',
      credentials: 'include',
      headers: this.buildCsrfHeaders(),
    });
    if (!res.ok && res.status !== 204) throw new Error(`logout_failed:${res.status}`);
  }

  // POST /api/auth/register — CSRF required
  async register<T = unknown>(input: Record<string, unknown>): Promise<T> {
    const res = await this.doFetch(this.url('/api/auth/register'), {
      method: 'POST',
      credentials: 'include',
      headers: this.buildCsrfHeaders(),
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`register_failed:${res.status}`);
    return (await res.json()) as T;
  }

  // POST /reset-password — CSRF required (password_request)
  async passwordRequest<T = unknown>(email: string): Promise<T> {
    const res = await this.doFetch(this.url('/reset-password'), {
      method: 'POST',
      credentials: 'include',
      headers: this.buildCsrfHeaders(),
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error(`password_request_failed:${res.status}`);
    return (await res.json()) as T;
  }

  // POST /reset-password/reset — CSRF required (password_reset)
  async passwordReset(token: string, password: string): Promise<void> {
    const res = await this.doFetch(this.url('/reset-password/reset'), {
      method: 'POST',
      credentials: 'include',
      headers: this.buildCsrfHeaders(),
      body: JSON.stringify({ token, password }),
    });
    if (!res.ok && res.status !== 204) throw new Error(`password_reset_failed:${res.status}`);
  }
}

// Stateless CSRF: callers are expected to generate a cryptographically
// secure random token per request and pass it to SDK methods. This SDK
// no longer fetches CSRF tokens from the backend.
