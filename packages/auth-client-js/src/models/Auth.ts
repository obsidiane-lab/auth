import type { Item } from '../lib/ports/resource-repository.port';

export interface Auth extends Item {
  tokenId?: string | null;
}
