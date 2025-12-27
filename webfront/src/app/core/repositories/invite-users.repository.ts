import { Injectable } from '@angular/core';
import { BaseResourceRepository } from './base-resource.repository';
import { FacadeFactory, InviteUserInviteRead } from 'bridge';
import { InviteUsersStore } from '../stores/invite-users.store';

@Injectable({
  providedIn: 'root',
})
export class InviteUsersRepository extends BaseResourceRepository<InviteUserInviteRead> {
  constructor(
    facadeFactory: FacadeFactory,
    store: InviteUsersStore,
  ) {
    super(facadeFactory, '/invite_users', store);
  }
}
