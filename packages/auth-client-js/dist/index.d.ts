import type { AuthClientConfig } from './core/httpClient';
import { ApiError } from './core/errors';
import { AuthApiClient } from './domains/auth';
import { UsersApiClient } from './domains/users';
import { InvitesApiClient } from './domains/invites';
import { SetupApiClient } from './domains/setup';
export type { UserRead, User, UpdateUserRolesInput, UpdateUserRolesResponse, LoginResponse, MeResponse, RegisterInput, RegisterResponse, RefreshResponse, PasswordForgotResponse, InviteStatusResponse, CompleteInviteResponse, InitialAdminInput, InitialAdminResponse, Invite, InviteUserRead, Item, Collection, } from './types';
export { ApiError } from './core/errors';
export interface AuthClientOptions extends AuthClientConfig {
}
export declare class AuthClient {
    private readonly http;
    readonly auth: AuthApiClient;
    readonly users: UsersApiClient;
    readonly invites: InvitesApiClient;
    readonly setup: SetupApiClient;
    constructor(options: AuthClientOptions);
    generateCsrfToken(): string;
}
export { ApiError as AuthSdkError };
