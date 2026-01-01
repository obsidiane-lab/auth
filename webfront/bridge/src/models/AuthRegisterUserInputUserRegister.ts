import type { Item } from '../lib/ports/resource-repository.port';

export interface AuthRegisterUserInputUserRegister extends Item {
  email: string | null;
  password: string | null;
}
