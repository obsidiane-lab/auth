import { Injectable } from '@angular/core';
import type { UserUserRead } from 'bridge';
import { BaseEntityStore } from './base-entity.store';

@Injectable({ providedIn: 'root' })
export class UsersStore extends BaseEntityStore<UserUserRead> {}
