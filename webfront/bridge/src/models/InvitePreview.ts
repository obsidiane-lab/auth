import type { Item } from '../lib/ports/resource-repository.port';

export interface InvitePreview extends Item {
  token?: string | null;
  email?: string | null;
  accepted?: boolean;
  expired?: boolean;
}
