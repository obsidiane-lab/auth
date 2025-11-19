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
import type { AuthUser, LoginResponse, MeResponse, RegisterResponse, InviteStatusResponse, InviteResource } from './models';
export declare class AuthClient {
    private readonly api;
    constructor(opts: AuthClientOptions);
    listUsers(): Promise<AuthUser[]>;
    getUser(id: number): Promise<AuthUser>;
    me(): Promise<MeResponse>;
    login(email: string, password: string): Promise<LoginResponse>;
    refresh(csrf?: string): Promise<unknown>;
    logout(): Promise<void>;
    register(input: RegisterPayload): Promise<RegisterResponse>;
    passwordRequest(email: string): Promise<unknown>;
    passwordReset(token: string, password: string): Promise<void>;
    inviteUser(email: string): Promise<InviteStatusResponse>;
    completeInvite(token: string, password: string, confirmPassword?: string): Promise<RegisterResponse>;
    listInvites(): Promise<InviteResource[]>;
    getInvite(id: number): Promise<InviteResource>;
    deleteUser(id: number): Promise<void>;
}
