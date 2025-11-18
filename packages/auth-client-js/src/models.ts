export interface AuthUser {
    id: number;
    email: string;
    roles: string[];
    isEmailVerified?: boolean;
}

export interface ApiErrorPayload {
    error?: string;
    message?: string;
    details?: Record<string, unknown>;
    status?: number;
}

export class AuthClientError extends Error {
    status?: number;
    code?: string;
    details?: Record<string, unknown>;
    payload?: ApiErrorPayload;

    constructor(message: string, payload: ApiErrorPayload = {}) {
        super(message);
        this.name = 'AuthClientError';
        this.payload = payload;
        this.status = payload.status;
        this.code = payload.error;
        this.details = payload.details;
    }
}

export interface LoginResponse {
    user: AuthUser;
    exp: number;
}

export interface MeResponse {
    user: AuthUser;
}

export interface RegisterResponse {
    user: AuthUser;
}

export interface InviteStatusResponse {
    status: 'INVITE_SENT' | string;
}

export interface InviteResource {
    id: number;
    email: string;
    createdAt: string;
    expiresAt: string;
    acceptedAt: string | null;
}

export interface JsonLdMeta {
    '@context'?: string | Record<string, unknown>;
    '@id'?: string;
    '@type'?: string | string[];
}

export type Item<T> = T & JsonLdMeta;

export interface Collection<T> extends JsonLdMeta {
    items: Array<Item<T>>;
    totalItems?: number;
}
