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
        init: RequestInit & {
            headers?: Record<string, string>;
        };
        response: Response;
        attempt: number;
    }) => Promise<Response | void> | Response | void;
}
export interface RegisterPayload {
    email: string;
    password: string;
}
export declare function generateCsrfToken(): string;
export * from './models';
import type { LoginResponse, MeResponse, RegisterResponse, InviteStatusResponse, InviteResource } from './models';
export declare class AuthClient {
    private readonly baseUrl;
    private readonly doFetch;
    private readonly defaultHeaders;
    private readonly timeoutMs?;
    private readonly originHeader?;
    private readonly attachOriginHeader;
    private readonly csrfTokenGenerator;
    private readonly onCsrfRejected?;
    constructor(opts: AuthClientOptions);
    private url;
    private computeOrigin;
    private toHeaderRecord;
    private headers;
    private buildCsrfHeaders;
    me<T = MeResponse>(): Promise<T>;
    login<T = LoginResponse>(email: string, password: string): Promise<T>;
    refresh<T = unknown>(csrf?: string): Promise<T>;
    logout(): Promise<void>;
    register<T = RegisterResponse>(input: RegisterPayload): Promise<T>;
    passwordRequest<T = unknown>(email: string): Promise<T>;
    passwordReset(token: string, password: string): Promise<void>;
    inviteUser(email: string): Promise<InviteStatusResponse>;
    completeInvite<T = RegisterResponse>(token: string, password: string, confirmPassword?: string): Promise<T>;
    listInvites(): Promise<InviteResource[]>;
    getInvite(id: number): Promise<InviteResource>;
    private request;
}
