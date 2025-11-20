import type { InternalHttpClient } from '../core/httpClient';
import type { Collection, UpdateUserRolesInput, UpdateUserRolesResponse, UserRead } from '../types';
export declare class UsersApiClient {
    private readonly http;
    constructor(http: InternalHttpClient);
    list(signal?: AbortSignal): Promise<Collection<UserRead>>;
    get(id: number, signal?: AbortSignal): Promise<UserRead>;
    updateRoles(id: number, input: UpdateUserRolesInput, signal?: AbortSignal): Promise<UpdateUserRolesResponse>;
    delete(id: number, signal?: AbortSignal): Promise<void>;
}
