export type FetchLike = typeof fetch;
export interface AuthClientOptions {
    baseUrl?: string;
    fetch?: FetchLike;
}
export interface RegisterPayload {
    email: string;
    password: string;
}
export declare function generateCsrfToken(): string;
export * from './models';
import type { AuthUser, LoginResponse, MeResponse, RegisterResponse, InviteStatusResponse, InviteResource } from './models';
export declare class AuthClient {
    private readonly baseUrl;
    private readonly doFetch;
    constructor(opts?: AuthClientOptions);
    private url;
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
    currentUserResource(): Promise<AuthUser>;
    listInvites(): Promise<InviteResource[]>;
    getInvite(id: number): Promise<InviteResource>;
}
