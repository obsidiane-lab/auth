import { computed, signal, type Signal } from '@angular/core';
import type { Iri, Item } from 'bridge';
import { iriOf } from '../utils/iri.util';

export abstract class BaseEntityStore<T extends Item> {
  private readonly entitiesByIri = signal<Record<string, T>>({});
  private readonly entitiesList = computed(() => Object.values(this.entitiesByIri()));

  entities(): Signal<T[]> {
    return this.entitiesList;
  }

  entity(iri: Iri): Signal<T | undefined> {
    return computed(() => (iri ? this.entitiesByIri()[iri] : undefined));
  }

  peek(iri: Iri): T | undefined {
    return iri ? this.entitiesByIri()[iri] : undefined;
  }

  setAll(entities: T[]): void {
    this.entitiesByIri.set(this.toRecord(entities));
  }

  upsert(entity: T): void {
    const iri = iriOf(entity);
    if (!iri) {
      return;
    }

    this.entitiesByIri.set({
      ...this.entitiesByIri(),
      [iri]: entity,
    });
  }

  upsertMany(entities: T[]): void {
    if (entities.length === 0) {
      return;
    }

    this.entitiesByIri.update((current) => ({
      ...current,
      ...this.toRecord(entities),
    }));
  }

  remove(iri: Iri): void {
    if (!iri) {
      return;
    }

    const current = this.entitiesByIri();
    if (!(iri in current)) {
      return;
    }

    const { [iri]: _, ...rest } = current;
    this.entitiesByIri.set(rest);
  }

  clear(): void {
    this.entitiesByIri.set({});
  }

  private toRecord(entities: T[]): Record<string, T> {
    const next: Record<string, T> = {};

    for (const entity of entities) {
      const iri = iriOf(entity);
      if (iri) {
        next[iri] = entity;
      }
    }

    return next;
  }
}
