import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SetupStatusService } from '../services/setup-status.service';

export const noSetupGuard: CanActivateFn = () => {
  const setupStatusService = inject(SetupStatusService);
  const router = inject(Router);

  const setupRequired = setupStatusService.isSetupRequired();

  if (setupRequired !== true) {
    return router.createUrlTree(['/login']);
  }

  return true;
};
