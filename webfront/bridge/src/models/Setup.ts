import type { Item } from '../lib/ports/resource-repository.port';

export interface Setup extends Item {
  tokenId?: string | null;
}
