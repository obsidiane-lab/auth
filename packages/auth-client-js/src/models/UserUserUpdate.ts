import type { Item } from '../lib/ports/resource-repository.port';

export interface UserUserUpdate extends Item {
  email: string;
  plainPassword?: string | null;
}
