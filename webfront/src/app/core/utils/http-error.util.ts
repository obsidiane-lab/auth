import { HttpErrorResponse } from '@angular/common/http';

export function extractHttpStatus(error: unknown): number | null {
  if (!(error instanceof HttpErrorResponse)) {
    return null;
  }

  const status = error.status;
  return status > 0 ? status : null;
}
