import type { InternalHttpClient } from '../core/httpClient';
import type { CompleteInviteResponse, InviteStatusResponse, LoginResponse, MeResponse, PasswordForgotResponse, RefreshResponse, RegisterInput, RegisterResponse } from '../types';
export declare class AuthApiClient {
    private readonly http;
    constructor(http: InternalHttpClient);
    me(signal?: AbortSignal): Promise<MeResponse>;
    login(email: string, password: string, signal?: AbortSignal): Promise<LoginResponse>;
    refresh(csrfToken?: string, signal?: AbortSignal): Promise<RefreshResponse>;
    logout(signal?: AbortSignal): Promise<void>;
    register(input: RegisterInput, signal?: AbortSignal): Promise<RegisterResponse>;
    requestPasswordReset(email: string, signal?: AbortSignal): Promise<PasswordForgotResponse>;
    resetPassword(token: string, password: string, signal?: AbortSignal): Promise<void>;
    inviteUser(email: string, signal?: AbortSignal): Promise<InviteStatusResponse>;
    completeInvite(token: string, password: string, signal?: AbortSignal): Promise<CompleteInviteResponse>;
}
