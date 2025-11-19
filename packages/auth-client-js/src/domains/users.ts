import type { InternalHttpClient } from '../core/httpClient';
import type { Collection, UserRead } from '../types';

const PATH_USERS = '/api/users';

export class UsersApiClient {
  constructor(private readonly http: InternalHttpClient) {}

  async list(signal?: AbortSignal): Promise<Collection<UserRead>> {
    return this.http.request<Collection<UserRead>>(
      'GET',
      PATH_USERS,
      { signal },
    );
  }

  async get(id: number, signal?: AbortSignal): Promise<UserRead> {
    return this.http.request<UserRead>(
      'GET',
      `${PATH_USERS}/${id}`,
      { signal },
    );
  }

  delete(id: number, signal?: AbortSignal): Promise<void> {
    return this.http.request<void>('DELETE', `${PATH_USERS}/${id}`, { signal });
  }
}
