import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { UserUserRead } from 'bridge';
import { SetupRepository } from '../repositories/setup.repository';

@Injectable({
  providedIn: 'root',
})
export class SetupService {
  constructor(private readonly setupRepository: SetupRepository) {}

  async createInitialAdmin(email: string, password: string): Promise<UserUserRead> {
    const response = await firstValueFrom(this.setupRepository.createInitialAdmin$(email, password));
    return response.user;
  }
}
