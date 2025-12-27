import { Injectable, type Signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AnyQuery, Collection, FacadeFactory, HttpCallOptions, InviteUserInviteRead, Iri, ResourceFacade } from 'bridge';
import { InviteUsersStore } from '../stores/invite-users.store';

@Injectable({
  providedIn: 'root',
})
export class InviteUsersRepository {
  private readonly facade: ResourceFacade<InviteUserInviteRead>;

  readonly entities = this.store.entities();

  constructor(
    facadeFactory: FacadeFactory,
    private readonly store: InviteUsersStore,
  ) {
    this.facade = facadeFactory.create<InviteUserInviteRead>({ url: '/invite_users' });
  }

  entity(iri: Iri): Signal<InviteUserInviteRead | undefined> {
    return this.store.entity(iri);
  }

  peek(iri: Iri): InviteUserInviteRead | undefined {
    return this.store.peek(iri);
  }

  collection$(query?: AnyQuery, opts?: HttpCallOptions): Observable<Collection<InviteUserInviteRead>> {
    return this.facade.getCollection$(query, opts).pipe(tap((collection) => this.store.upsertMany(collection.member)));
  }

  get$(iri: string, opts?: HttpCallOptions): Observable<InviteUserInviteRead> {
    return this.facade.get$(iri, opts).pipe(tap((invite) => this.store.upsert(invite)));
  }
}
