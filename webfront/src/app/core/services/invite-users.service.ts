import { EnvironmentInjector, Injectable } from '@angular/core';
import type { InviteUserInviteRead } from 'bridge';
import { BaseEntityService } from './base-entity.service';
import { InviteUsersRepository } from '../repositories/invite-users.repository';

@Injectable({
  providedIn: 'root',
})
export class InviteUsersService extends BaseEntityService<InviteUserInviteRead, InviteUsersRepository> {
  constructor(
    inviteUsersRepository: InviteUsersRepository,
    injector: EnvironmentInjector,
  ) {
    super(inviteUsersRepository, injector);
  }
}
