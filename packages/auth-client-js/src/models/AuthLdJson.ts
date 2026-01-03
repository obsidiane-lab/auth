import type { Item } from '../lib/ports/resource-repository.port';

export interface AuthLdJson extends Item {
  tokenId?: string | null;
}
