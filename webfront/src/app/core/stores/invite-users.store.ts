import { Injectable } from '@angular/core';
import type { InviteUserInviteRead } from 'bridge';
import { BaseEntityStore } from './base-entity.store';

@Injectable({ providedIn: 'root' })
export class InviteUsersStore extends BaseEntityStore<InviteUserInviteRead> {}
