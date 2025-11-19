import type { InternalHttpClient } from '../core/httpClient';
import type { Collection, InviteUserRead } from '../types';

const PATH_INVITE_USERS = '/api/invite_users';

export class InvitesApiClient {
  constructor(private readonly http: InternalHttpClient) {}

  async list(signal?: AbortSignal): Promise<Collection<InviteUserRead>> {
    return this.http.request<Collection<InviteUserRead>>(
      'GET',
      PATH_INVITE_USERS,
      { signal },
    );
  }

  async get(id: number, signal?: AbortSignal): Promise<InviteUserRead> {
    return this.http.request<InviteUserRead>(
      'GET',
      `${PATH_INVITE_USERS}/${id}`,
      { signal },
    );
  }
}
