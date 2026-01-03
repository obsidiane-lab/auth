import type { Item } from '../lib/ports/resource-repository.port';

export interface InviteUserInviteRead extends Item {
  id?: number;
  email?: string;
  createdAt?: string;
  expiresAt?: string;
  acceptedAt?: string | null;
}
