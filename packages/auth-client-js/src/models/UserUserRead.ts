import type { Item } from '../lib/ports/resource-repository.port';

export interface UserUserRead extends Item {
  id?: number;
  email: string;
  roles?: string[];
  emailVerified?: boolean;
  lastLoginAt?: string | null;
}
