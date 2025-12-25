import { type CsrfTokenGenerator } from './csrf';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export interface RequestOptions {
    headers?: HeadersInit;
    json?: unknown;
    body?: BodyInit | null;
    /**
     * When true, a fresh CSRF token is generated and sent.
     * When a string, it is used as CSRF token value.
     */
    csrf?: boolean | string;
    signal?: AbortSignal;
}
export interface AuthClientConfig {
    baseUrl: string;
    defaultHeaders?: HeadersInit;
    credentials?: RequestCredentials;
    csrfHeaderName?: string;
    /**
     * Optional custom CSRF token generator.
     * If omitted, a secure browser-friendly generator is used.
     */
    csrfTokenGenerator?: CsrfTokenGenerator;
    /**
     * For testing or advanced usage, a custom fetch implementation can be provided.
     * In browsers, the global fetch is used by default.
     */
    fetchImpl?: typeof fetch;
}
/**
 * Low-level HTTP client used by the SDK.
 * Delegates CSRF generation, header construction and response decoding
 * to dedicated helpers for better separation of concerns.
 *
 * @internal
 */
export declare class InternalHttpClient {
    readonly baseUrl: string;
    readonly credentials: RequestCredentials;
    readonly csrfHeaderName: string;
    private readonly defaultHeaders;
    private readonly csrfTokenGenerator;
    private readonly fetchImpl;
    constructor(config: AuthClientConfig);
    /**
     * Expose the CSRF token generator so callers can generate compatible tokens
     * for custom requests when needed.
     */
    generateCsrfToken(): string;
    request<T>(method: HttpMethod, path: string, options?: RequestOptions): Promise<T>;
}
