import { EnvironmentInjector, effect, runInInjectionContext, type Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { AnyQuery, Collection, HttpCallOptions, Item } from 'bridge';
import { BaseResourceRepository } from '../repositories/base-resource.repository';

export abstract class BaseEntityService<T extends Item, TRepo extends BaseResourceRepository<T>> {
  readonly entities = this.repository.entities;

  private readonly loadingByIri = new Set<string>();

  protected constructor(
    protected readonly repository: TRepo,
    protected readonly injector: EnvironmentInjector,
  ) {}

  entity(iri: string): Signal<T | undefined> {
    const entitySignal = this.repository.entity(iri);

    runInInjectionContext(this.injector, () => {
      effect(() => {
        if (entitySignal() || this.loadingByIri.has(iri)) {
          return;
        }

        this.loadingByIri.add(iri);
        void this.fetchByIri(iri).finally(() => {
          this.loadingByIri.delete(iri);
        });
      });
    });

    return entitySignal;
  }

  peekEntity(iri: string): T | undefined {
    return this.repository.peek(iri);
  }

  async list(query?: AnyQuery, opts?: HttpCallOptions): Promise<Collection<T>> {
    return firstValueFrom(this.repository.collection$(query, opts));
  }

  async fetchByIri(iri: string, opts?: HttpCallOptions): Promise<T> {
    return firstValueFrom(this.repository.get$(iri, opts));
  }

  async delete(iri: string, opts?: HttpCallOptions): Promise<void> {
    await firstValueFrom(this.repository.delete$(iri, opts));
  }
}
