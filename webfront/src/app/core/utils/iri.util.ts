import type { Iri, Item } from 'bridge';

export function iriOf(item: Item | null | undefined): Iri {
  if (!item) {
    return undefined;
  }

  const iri = item['@id'];
  return typeof iri === 'string' && iri.length > 0 ? iri : undefined;
}
