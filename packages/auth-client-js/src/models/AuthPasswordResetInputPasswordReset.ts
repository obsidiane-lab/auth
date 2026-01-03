import type { Item } from '../lib/ports/resource-repository.port';

export interface AuthPasswordResetInputPasswordReset extends Item {
  token: string;
  password: string;
}
