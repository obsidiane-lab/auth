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
    private headers;
    private generateCsrfToken;
    private setDoubleSubmitCookie;
    private buildCsrfHeaders;
    me<T = unknown>(): Promise<T>;
    login<T = unknown>(email: string, password: string): Promise<T>;
    refresh<T = unknown>(csrf?: string): Promise<T>;
    logout(): Promise<void>;
    register<T = unknown>(input: Record<string, unknown>): Promise<T>;
    passwordRequest<T = unknown>(email: string): Promise<T>;
    passwordReset(token: string, password: string): Promise<void>;
}
