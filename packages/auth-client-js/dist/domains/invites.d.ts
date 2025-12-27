import type { InternalHttpClient } from '../core/httpClient';
import type { Collection, InviteUserRead } from '../types';
export declare class InvitesApiClient {
    private readonly http;
    constructor(http: InternalHttpClient);
    list(signal?: AbortSignal): Promise<Collection<InviteUserRead>>;
    get(id: number, signal?: AbortSignal): Promise<InviteUserRead>;
}
