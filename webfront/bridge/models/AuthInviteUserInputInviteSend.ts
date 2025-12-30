import type { Item } from '../lib/ports/resource-repository.port';

export interface AuthInviteUserInputInviteSend extends Item {
  email: string | null;
}
