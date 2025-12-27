import { Injectable, computed, type Signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  AnyQuery,
  BridgeFacade,
  Collection,
  FacadeFactory,
  HttpCallOptions,
  Iri,
  ResourceFacade,
  UserUserRead,
} from 'bridge';
import { UsersStore } from '../stores/users.store';

@Injectable({
  providedIn: 'root',
})
export class UsersRepository {
  private readonly facade: ResourceFacade<UserUserRead>;

  readonly entities = this.store.entities();

  constructor(
    facadeFactory: FacadeFactory,
    private readonly bridge: BridgeFacade,
    private readonly store: UsersStore,
  ) {
    this.facade = facadeFactory.create<UserUserRead>({ url: '/users' });
  }

  entity(iri: Iri): Signal<UserUserRead | undefined> {
    return this.store.entity(iri);
  }

  peek(iri: Iri): UserUserRead | undefined {
    return this.store.peek(iri);
  }

  collection$(query?: AnyQuery, opts?: HttpCallOptions): Observable<Collection<UserUserRead>> {
    return this.facade.getCollection$(query, opts).pipe(tap((collection) => this.store.upsertMany(collection.member)));
  }

  get$(iri: string, opts?: HttpCallOptions): Observable<UserUserRead> {
    return this.facade.get$(iri, opts).pipe(tap((user) => this.store.upsert(user)));
  }

  delete$(iri: string, opts?: HttpCallOptions): Observable<void> {
    return this.facade.delete$(iri, opts).pipe(tap(() => this.store.remove(iri)));
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
