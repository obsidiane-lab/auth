import { Injectable, computed, type Signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { BridgeFacade, FacadeFactory, UserUserRead } from 'bridge';
import { BaseResourceRepository } from './base-resource.repository';
import { UsersStore } from '../stores/users.store';

@Injectable({
  providedIn: 'root',
})
export class UsersRepository extends BaseResourceRepository<UserUserRead> {
  constructor(
    facadeFactory: FacadeFactory,
    private readonly bridge: BridgeFacade,
    store: UsersStore,
  ) {
    super(facadeFactory, '/users', store);
  }

  updateRoles$(id: number, roles: string[]): Observable<{ user: UserUserRead }> {
    return this.bridge
      .post$<{ user: UserUserRead }, { roles: string[] }>(`/users/${id}/roles`, { roles })
      .pipe(tap(({ user }) => this.store.upsert(user)));
  }

  userByEmail(email: string): Signal<UserUserRead | undefined> {
    return computed(() => this.entities().find((user) => user.email?.toLowerCase() === email.toLowerCase()));
  }
}
