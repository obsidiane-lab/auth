/*
 Lightweight JS SDK for Obsidiane Auth
 - Uses fetch with credentials: 'include' so cookies flow as required
 - Gère automatiquement les tokens CSRF stateless (header `csrf-token`)
*/

const CSRF_HEADER_NAME = 'csrf-token' as const;

const API_PATHS = {
    AUTH_ME: '/api/auth/me',
    AUTH_LOGIN: '/api/auth/login',
    AUTH_REFRESH: '/api/auth/refresh',
    AUTH_LOGOUT: '/api/auth/logout',
    AUTH_REGISTER: '/api/auth/register',
    AUTH_PASSWORD_FORGOT: '/api/auth/password/forgot',
    AUTH_PASSWORD_RESET: '/api/auth/password/reset',
    AUTH_INVITE: '/api/auth/invite',
    AUTH_INVITE_COMPLETE: '/api/auth/invite/complete',
    USERS: '/api/users',
    USER: (id: number) => `/api/users/${id}`,
    INVITE_USERS: '/api/invite_users',
    INVITE_USER: (id: number) => `/api/invite_users/${id}`,
} as const;

export type FetchLike = typeof fetch;

export interface AuthClientOptions {
    baseUrl: string;
    fetch?: FetchLike;
    defaultHeaders?: Record<string, string>;
    timeoutMs?: number;
    origin?: string;
    csrfTokenGenerator?: () => string;
    onCsrfRejected?: (context: {
        path: string;
        init: RequestInit & { headers?: Record<string, string> };
        response: Response;
        attempt: number;
    }) => Promise<Response | void> | Response | void;
}

export interface RegisterPayload {
    email: string;
    password: string;
}

export function generateCsrfToken(): string {
    if (typeof globalThis.crypto !== 'undefined') {
        if (typeof globalThis.crypto.randomUUID === 'function') {
            return globalThis.crypto.randomUUID().replace(/-/g, '');
        }
        if (typeof globalThis.crypto.getRandomValues === 'function') {
            const bytes = new Uint8Array(16);
            globalThis.crypto.getRandomValues(bytes);
            return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
        }
    }

    // Node ESM/SSR: pseudo-random fallback (non crypto) to stay compatible in tous les environnements
    if (typeof Math.random === 'function') {
        const rand = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
        return `${rand()}${rand()}${rand()}${rand()}`.slice(0, 32);
    }

    throw new Error('Secure crypto unavailable; provide a crypto implementation to generate CSRF tokens.');
}

export * from './models';
import type {AuthUser, LoginResponse, MeResponse, RegisterResponse, InviteStatusResponse, InviteResource} from './models';
import {AuthClientError} from './models';

class ApiService {
    private readonly baseUrl: string;
    private readonly doFetch: FetchLike;
    private readonly defaultHeaders: Record<string, string>;
    private readonly timeoutMs?: number;
    private readonly originHeader?: string;
    private readonly attachOriginHeader: boolean;
    private readonly csrfTokenGenerator: () => string;
    private readonly onCsrfRejected?: AuthClientOptions['onCsrfRejected'];

    constructor(opts: AuthClientOptions) {
        if (!opts.baseUrl) {
            throw new Error('baseUrl is required');
        }

        this.baseUrl = opts.baseUrl.replace(/\/$/, '');
        const baseFetch = opts.fetch ?? (globalThis.fetch as FetchLike | undefined);
        if (!baseFetch) {
            throw new Error('No fetch implementation available');
        }
        this.doFetch = baseFetch.bind(globalThis) as FetchLike;
        this.defaultHeaders = {...(opts.defaultHeaders ?? {})};
        this.timeoutMs = opts.timeoutMs;
        this.originHeader = opts.origin ?? this.computeOrigin(this.baseUrl);
        const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
        this.attachOriginHeader = !isBrowser && !!this.originHeader;
        this.csrfTokenGenerator = opts.csrfTokenGenerator ?? generateCsrfToken;
        this.onCsrfRejected = opts.onCsrfRejected;
    }

    private url(path: string): string {
        return `${this.baseUrl}${path}`;
    }

    private computeOrigin(url: string): string | undefined {
        try {
            const u = new URL(url);
            return `${u.protocol}//${u.host}`;
        } catch (_) {
            return undefined;
        }
    }

    private toHeaderRecord(headers?: HeadersInit): Record<string, string> {
        if (!headers) return {};
        if (typeof Headers !== 'undefined' && headers instanceof Headers) {
            const out: Record<string, string> = {};
            headers.forEach((value, key) => {
                out[key] = value;
            });
            return out;
        }
        if (Array.isArray(headers)) {
            return headers.reduce((acc, [k, v]) => {
                acc[String(k)] = String(v);
                return acc;
            }, {} as Record<string, string>);
        }
        return {...(headers as Record<string, string>)};
    }

    // Utility to build headers with optional CSRF token
    private headers(csrf?: string): Record<string, string> {
        const h: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/ld+json',
            ...this.defaultHeaders,
        };
        if (csrf) {
            h[CSRF_HEADER_NAME] = csrf;
        }
        if (this.attachOriginHeader && this.originHeader && !('Origin' in h) && !('origin' in h)) {
            h['Origin'] = this.originHeader;
        }
        return h;
    }

    buildCsrfHeaders(): Record<string, string> {
        const token = this.csrfTokenGenerator();
        return this.headers(token);
    }

    async getJson<T>(path: string): Promise<T> {
        return await this.request<T>(path, {
            method: 'GET',
            headers: {Accept: 'application/ld+json'},
        });
    }

    async getCollection<T>(path: string): Promise<T[]> {
        const raw = await this.getJson<unknown>(path);

        if (Array.isArray(raw)) {
            return raw as T[];
        }

        if (raw && typeof raw === 'object' && Array.isArray((raw as any).items)) {
            return (raw as any).items as T[];
        }

        return [];
    }

    async postWithCsrf<T>(path: string, body?: unknown, allowNoContent = false): Promise<T> {
        const init: RequestInit & { headers?: Record<string, string> } = {
            method: 'POST',
            headers: this.buildCsrfHeaders(),
        };

        if (body !== undefined) {
            init.body = JSON.stringify(body);
        }

        const opts = allowNoContent ? {allowNoContent: true} : {};
        return await this.request<T>(path, init, opts);
    }

    async request<T>(
        path: string,
        init: RequestInit & { headers?: Record<string, string> },
        opts: { allowNoContent?: boolean } = {},
    ): Promise<T> {
        const timeout = this.timeoutMs ?? 0;
        const controller = typeof AbortController !== 'undefined' && timeout > 0 && !init.signal
            ? new AbortController()
            : undefined;

        const signal = init.signal ?? controller?.signal;

        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        if (controller && timeout > 0) {
            timeoutId = setTimeout(() => controller.abort(), timeout);
        }

        const fetchWith = async (overrideInit?: RequestInit & { headers?: Record<string, string> }) => {
            const baseHeaders = this.toHeaderRecord(init.headers);
            const overrideHeaders = this.toHeaderRecord(overrideInit?.headers);
            return await this.doFetch(this.url(path), {
                ...init,
                ...(overrideInit ?? {}),
                credentials: 'include',
                headers: {...this.headers(), ...baseHeaders, ...overrideHeaders},
                signal,
            });
        };

        let res = await fetchWith();

        // Auto-réessai 1x en cas de 403 CSRF, exposé via hook onCsrfRejected
        if (res.status === 403 && init.method && init.method.toUpperCase() !== 'GET') {
            const retryInit = {
                ...init,
                headers: {
                    ...this.toHeaderRecord(init.headers),
                    [CSRF_HEADER_NAME]: this.csrfTokenGenerator(),
                },
            };
            if (this.onCsrfRejected) {
                const maybe = await this.onCsrfRejected({path, init: retryInit, response: res, attempt: 1});
                if (maybe instanceof Response) {
                    res = maybe;
                } else {
                    res = await fetchWith(retryInit);
                }
            } else {
                res = await fetchWith(retryInit);
            }
        }

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        const contentType = res.headers.get('content-type') ?? '';
        const isJson = contentType.toLowerCase().includes('application/json');
        let payload: any = {};
        let rawText: string | undefined;

        if (isJson) {
            payload = await res.json().catch(() => ({}));
        } else {
            rawText = await res.text().catch(() => '');
            if (rawText) {
                try {
                    payload = JSON.parse(rawText);
                } catch {
                    payload = {};
                }
            }
        }

        if (!res.ok && !(opts.allowNoContent && res.status === 204)) {
            const message =
                (payload && typeof payload === 'object' && (payload.error || payload.message))
                    ? (payload.error ?? payload.message)
                    : (rawText && rawText.trim() !== '' ? rawText : `request_failed:${res.status}`);
            throw new AuthClientError(
                message as string,
                {...(payload ?? {}), status: res.status, raw: rawText}
            );
        }

        if (!isJson && rawText && (payload === null || Object.keys(payload).length === 0)) {
            return {raw: rawText} as T;
        }

        return payload as T;
    }
}

export class AuthClient {
    private readonly api: ApiService;

    constructor(opts: AuthClientOptions) {
        this.api = new ApiService(opts);
    }

    // --- ApiPlatform helpers (User resources) ---

    // GET /api/users
    async listUsers(): Promise<AuthUser[]> {
        return await this.api.getCollection<AuthUser>(API_PATHS.USERS);
    }

    // GET /api/users/{id}
    async getUser(id: number): Promise<AuthUser> {
        return await this.api.getJson<AuthUser>(API_PATHS.USER(id));
    }

    // --- Auth endpoints ---

    // GET /api/auth/me
    async me(): Promise<MeResponse> {
        return await this.api.request<MeResponse>(API_PATHS.AUTH_ME, {method: 'GET', headers: {}});
    }

    // POST /api/auth/login — CSRF required
    async login(email: string, password: string): Promise<LoginResponse> {
        return await this.api.postWithCsrf<LoginResponse>(API_PATHS.AUTH_LOGIN, {email, password});
    }

    // POST /api/auth/refresh — cookie-based, CSRF optional
    async refresh(csrf?: string): Promise<unknown> {
        const headers: Record<string, string> = {};
        if (csrf) {
            headers[CSRF_HEADER_NAME] = csrf;
        }
        return await this.api.request<unknown>(API_PATHS.AUTH_REFRESH, {
            method: 'POST',
            headers,
        });
    }

    // POST /api/auth/logout — CSRF required
    async logout(): Promise<void> {
        await this.api.postWithCsrf<void>(API_PATHS.AUTH_LOGOUT, undefined, true);
    }

    // POST /api/auth/register — CSRF required
    async register(input: RegisterPayload): Promise<RegisterResponse> {
        const {email, password} = input;
        if (typeof email !== 'string' || typeof password !== 'string') {
            throw new Error('register inputs must include string email/password');
        }
        return await this.api.postWithCsrf<RegisterResponse>(API_PATHS.AUTH_REGISTER, {email, password});
    }

    // POST /api/auth/password/forgot — CSRF required
    async passwordRequest(email: string): Promise<unknown> {
        return await this.api.postWithCsrf<unknown>(API_PATHS.AUTH_PASSWORD_FORGOT, {email});
    }

    // POST /api/auth/password/reset — CSRF required
    async passwordReset(token: string, password: string): Promise<void> {
        await this.api.postWithCsrf<void>(API_PATHS.AUTH_PASSWORD_RESET, {token, password}, true);
    }

    // POST /api/auth/invite — CSRF required, admin only
    async inviteUser(email: string): Promise<InviteStatusResponse> {
        return await this.api.postWithCsrf<InviteStatusResponse>(API_PATHS.AUTH_INVITE, {email});
    }

    // POST /api/auth/invite/complete — CSRF required
    async completeInvite(token: string, password: string, confirmPassword?: string): Promise<RegisterResponse> {
        return await this.api.postWithCsrf<RegisterResponse>(API_PATHS.AUTH_INVITE_COMPLETE, {
            token,
            password,
            confirmPassword: confirmPassword ?? password,
        });
    }

    // --- ApiPlatform helpers (Invite resources) ---

    // GET /api/invite_users
    async listInvites(): Promise<InviteResource[]> {
        return await this.api.getCollection<InviteResource>(API_PATHS.INVITE_USERS);
    }

    // GET /api/invite_users/{id}
    async getInvite(id: number): Promise<InviteResource> {
        return await this.api.getJson<InviteResource>(API_PATHS.INVITE_USER(id));
    }

    // DELETE /api/users/{id}
    async deleteUser(id: number): Promise<void> {
        await this.api.request<void>(API_PATHS.USER(id), {
            method: 'DELETE',
            headers: {},
        }, {allowNoContent: true});
    }
}
