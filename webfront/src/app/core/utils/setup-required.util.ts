import { HttpErrorResponse } from '@angular/common/http';

const INITIAL_ADMIN_REQUIRED_DETAIL = 'Initial admin is required.';

export function isInitialAdminRequiredError(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) {
    return false;
  }

  if (error.status !== 409) {
    return false;
  }

  const detail = (error.error as { detail?: string } | null)?.detail;
  return detail === INITIAL_ADMIN_REQUIRED_DETAIL;
}
