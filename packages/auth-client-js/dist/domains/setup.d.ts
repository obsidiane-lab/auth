import type { InternalHttpClient } from '../core/httpClient';
import type { InitialAdminInput, InitialAdminResponse } from '../types';
export declare class SetupApiClient {
    private readonly http;
    constructor(http: InternalHttpClient);
    createInitialAdmin(input: InitialAdminInput, signal?: AbortSignal): Promise<InitialAdminResponse>;
}
