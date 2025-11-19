import type { InternalHttpClient } from '../core/httpClient';
import type { InitialAdminInput, InitialAdminResponse } from '../types';

const PATH_SETUP_INITIAL_ADMIN = '/api/setup/admin';

export class SetupApiClient {
  constructor(private readonly http: InternalHttpClient) {}

  createInitialAdmin(input: InitialAdminInput, signal?: AbortSignal): Promise<InitialAdminResponse> {
    return this.http.request<InitialAdminResponse>('POST', PATH_SETUP_INITIAL_ADMIN, {
      json: input,
      csrf: true,
      signal,
    });
  }
}

