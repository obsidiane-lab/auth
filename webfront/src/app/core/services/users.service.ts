import { EnvironmentInjector, Injectable, effect, runInInjectionContext } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { UserUserRead } from 'bridge';
import { BaseEntityService } from './base-entity.service';
import { UsersRepository } from '../repositories/users.repository';

@Injectable({
  providedIn: 'root',
})
export class UsersService extends BaseEntityService<UserUserRead, UsersRepository> {
  private loadingCollection = false;

  constructor(
    private readonly usersRepository: UsersRepository,
    injector: EnvironmentInjector,
  ) {
    super(usersRepository, injector);
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

  async updateRoles(id: number, roles: string[]): Promise<UserUserRead> {
    const response = await firstValueFrom(this.usersRepository.updateRoles$(id, roles));
    return response.user;
  }
}
