import { type Signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import type { AnyQuery, Collection, FacadeFactory, HttpCallOptions, Iri, Item, ResourceFacade } from 'bridge';
import { BaseEntityStore } from '../stores/base-entity.store';

export abstract class BaseResourceRepository<T extends Item> {
  protected readonly facade: ResourceFacade<T>;

  readonly entities = this.store.entities();

  protected constructor(
    facadeFactory: FacadeFactory,
    resourceUrl: string,
    protected readonly store: BaseEntityStore<T>,
  ) {
    this.facade = facadeFactory.create<T>({ url: resourceUrl });
  }

  entity(iri: Iri): Signal<T | undefined> {
    return this.store.entity(iri);
  }

  peek(iri: Iri): T | undefined {
    return this.store.peek(iri);
  }

  collection$(query?: AnyQuery, opts?: HttpCallOptions): Observable<Collection<T>> {
    return this.facade.getCollection$(query, opts).pipe(tap((collection) => this.store.upsertMany(collection.member)));
  }

  get$(iri: string, opts?: HttpCallOptions): Observable<T> {
    return this.facade.get$(iri, opts).pipe(tap((entity) => this.store.upsert(entity)));
  }

  delete$(iri: string, opts?: HttpCallOptions): Observable<void> {
    return this.facade.delete$(iri, opts).pipe(tap(() => this.store.remove(iri)));
  }
}
