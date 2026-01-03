import type { Item } from '../lib/ports/resource-repository.port';

export interface UserUpdateUserRolesInputUserRoles extends Item {
  roles: string[] | null;
}
