import type { Item } from '../lib/ports/resource-repository.port';

export interface AuthInviteCompleteInputInviteComplete extends Item {
  token: string;
  password: string;
  confirmPassword: string;
}
