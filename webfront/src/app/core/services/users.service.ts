import { EnvironmentInjector, Injectable, effect, runInInjectionContext, type Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { AnyQuery, Collection, HttpCallOptions, UserUserRead } from 'bridge';
import { UsersRepository } from '../repositories/users.repository';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  readonly entities = this.usersRepository.entities;

  private readonly loadingByIri = new Set<string>();
  private loadingCollection = false;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly injector: EnvironmentInjector,
  ) {}

  entity(iri: string): Signal<UserUserRead | undefined> {
    const entitySignal = this.usersRepository.entity(iri);

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

  peekEntity(iri: string): UserUserRead | undefined {
    return this.usersRepository.peek(iri);
  }

  userByEmail(email: string) {
    const userSignal = this.usersRepository.userByEmail(email);

    runInInjectionContext(this.injector, () => {
      effect(() => {
        if (userSignal() || this.loadingCollection || this.entities().length > 0) {
          return;
        }

        this.loadingCollection = true;
        void this.list().finally(() => {
          this.loadingCollection = false;
        });
      });
    });

    return userSignal;
  }

  async list(query?: AnyQuery, opts?: HttpCallOptions): Promise<Collection<UserUserRead>> {
    return firstValueFrom(this.usersRepository.collection$(query, opts));
  }

  async fetchByIri(iri: string, opts?: HttpCallOptions): Promise<UserUserRead> {
    return firstValueFrom(this.usersRepository.get$(iri, opts));
  }

  async delete(iri: string, opts?: HttpCallOptions): Promise<void> {
    await firstValueFrom(this.usersRepository.delete$(iri, opts));
  }

  async updateRoles(id: number, roles: string[]): Promise<UserUserRead> {
    const response = await firstValueFrom(this.usersRepository.updateRoles$(id, roles));
    return response.user;
  }
}
