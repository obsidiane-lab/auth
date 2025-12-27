import { EnvironmentInjector, Injectable, effect, runInInjectionContext, type Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { AnyQuery, Collection, HttpCallOptions, InviteUserInviteRead } from 'bridge';
import { InviteUsersRepository } from '../repositories/invite-users.repository';

@Injectable({
  providedIn: 'root',
})
export class InviteUsersService {
  readonly entities = this.inviteUsersRepository.entities;

  private readonly loadingByIri = new Set<string>();

  constructor(
    private readonly inviteUsersRepository: InviteUsersRepository,
    private readonly injector: EnvironmentInjector,
  ) {}

  entity(iri: string): Signal<InviteUserInviteRead | undefined> {
    const entitySignal = this.inviteUsersRepository.entity(iri);

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

  peekEntity(iri: string): InviteUserInviteRead | undefined {
    return this.inviteUsersRepository.peek(iri);
  }

  async list(query?: AnyQuery, opts?: HttpCallOptions): Promise<Collection<InviteUserInviteRead>> {
    return firstValueFrom(this.inviteUsersRepository.collection$(query, opts));
  }

  async fetchByIri(iri: string, opts?: HttpCallOptions): Promise<InviteUserInviteRead> {
    return firstValueFrom(this.inviteUsersRepository.get$(iri, opts));
  }
}
