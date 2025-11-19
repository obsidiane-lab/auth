export interface ApiErrorPayload {
    error?: string;
    details?: unknown;
    [key: string]: unknown;
}
export declare class ApiError extends Error {
    readonly status: number;
    readonly errorCode: string;
    readonly details?: unknown;
    readonly payload: ApiErrorPayload;
    constructor(status: number, errorCode: string, details?: unknown, payload?: ApiErrorPayload);
    static fromPayload(status: number, payload: unknown): ApiError;
}
