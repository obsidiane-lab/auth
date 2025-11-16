/*
 Lightweight JS SDK for Obsidiane Auth
 - Uses fetch with credentials: 'include' so cookies flow as required
 - Gère automatiquement les tokens CSRF stateless (header `csrf-token`)
 - Types sont générés depuis OpenAPI dans ./types.gen.ts par le script prepublishOnly
*/
export class AuthClient {
    constructor(opts = {}) {
        this.baseUrl = (opts.baseUrl ?? '').replace(/\/$/, '');
        const baseFetch = opts.fetch ?? globalThis.fetch;
        if (!baseFetch) {
            throw new Error('No fetch implementation available');
        }
        this.doFetch = baseFetch.bind(globalThis);
    }
    url(path) {
        return `${this.baseUrl}${path}`;
    }
    // Utility to build headers with optional CSRF token
    headers(csrf) {
        const h = { 'Content-Type': 'application/json' };
        if (csrf)
            h['csrf-token'] = csrf;
        return h;
    }
    generateCsrfToken() {
        if (typeof globalThis.crypto !== 'undefined' && 'getRandomValues' in globalThis.crypto) {
            const bytes = new Uint8Array(16);
            globalThis.crypto.getRandomValues(bytes);
            return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
        }
        return Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    buildCsrfHeaders() {
        const token = this.generateCsrfToken();
        return this.headers(token);
    }
    // GET /api/auth/me
    async me() {
        const res = await this.doFetch(this.url('/api/auth/me'), {
            method: 'GET',
            credentials: 'include',
        });
        if (!res.ok)
            throw new Error(`me_failed:${res.status}`);
        return (await res.json());
    }
    // POST /api/login — CSRF required
    async login(email, password) {
        const res = await this.doFetch(this.url('/api/login'), {
            method: 'POST',
            credentials: 'include',
            headers: this.buildCsrfHeaders(),
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok)
            throw new Error(`login_failed:${res.status}`);
        return (await res.json());
    }
    // POST /api/token/refresh — cookie-based, CSRF optional
    async refresh(csrf) {
        const res = await this.doFetch(this.url('/api/token/refresh'), {
            method: 'POST',
            credentials: 'include',
            headers: this.headers(csrf),
        });
        if (!res.ok)
            throw new Error(`refresh_failed:${res.status}`);
        return (await res.json());
    }
    // POST /api/auth/logout — CSRF required
    async logout() {
        const res = await this.doFetch(this.url('/api/auth/logout'), {
            method: 'POST',
            credentials: 'include',
            headers: this.buildCsrfHeaders(),
        });
        if (!res.ok && res.status !== 204)
            throw new Error(`logout_failed:${res.status}`);
    }
    // POST /api/auth/register — CSRF required
    async register(input) {
        const res = await this.doFetch(this.url('/api/auth/register'), {
            method: 'POST',
            credentials: 'include',
            headers: this.buildCsrfHeaders(),
            body: JSON.stringify(input),
        });
        if (!res.ok)
            throw new Error(`register_failed:${res.status}`);
        return (await res.json());
    }
    // POST /reset-password — CSRF required (password_request)
    async passwordRequest(email) {
        const res = await this.doFetch(this.url('/reset-password'), {
            method: 'POST',
            credentials: 'include',
            headers: this.buildCsrfHeaders(),
            body: JSON.stringify({ email }),
        });
        if (!res.ok)
            throw new Error(`password_request_failed:${res.status}`);
        return (await res.json());
    }
    // POST /reset-password/reset — CSRF required (password_reset)
    async passwordReset(token, password) {
        const res = await this.doFetch(this.url('/reset-password/reset'), {
            method: 'POST',
            credentials: 'include',
            headers: this.buildCsrfHeaders(),
            body: JSON.stringify({ token, password }),
        });
        if (!res.ok && res.status !== 204)
            throw new Error(`password_reset_failed:${res.status}`);
    }
}
