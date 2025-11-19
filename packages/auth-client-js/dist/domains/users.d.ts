import type { InternalHttpClient } from '../core/httpClient';
import type { Collection, UserRead } from '../types';
export declare class UsersApiClient {
    private readonly http;
    constructor(http: InternalHttpClient);
    list(signal?: AbortSignal): Promise<Collection<UserRead>>;
    get(id: number, signal?: AbortSignal): Promise<UserRead>;
    delete(id: number, signal?: AbortSignal): Promise<void>;
}
