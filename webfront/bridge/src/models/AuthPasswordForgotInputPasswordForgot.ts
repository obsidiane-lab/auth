import type { Item } from '../lib/ports/resource-repository.port';

export interface AuthPasswordForgotInputPasswordForgot extends Item {
  email: string | null;
}
