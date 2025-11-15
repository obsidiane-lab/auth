export type FetchLike = typeof fetch;
export interface AuthClientOptions {
    baseUrl?: string;
    fetch?: FetchLike;
}
export declare class AuthClient {
    private readonly baseUrl;
    private readonly doFetch;
    constructor(opts?: AuthClientOptions);
    private url;
    csrf(tokenId: string): Promise<string>;
    private headers;
    me<T = unknown>(): Promise<T>;
    login<T = unknown>(email: string, password: string, csrf: string): Promise<T>;
    refresh<T = unknown>(csrf?: string): Promise<T>;
    logout(csrf: string): Promise<void>;
    register<T = unknown>(input: Record<string, unknown>, csrf: string): Promise<T>;
    passwordRequest<T = unknown>(email: string, csrf: string): Promise<T>;
    passwordReset(token: string, password: string, csrf: string): Promise<void>;
}
export declare function getCsrfFromCookie(): string | null;
