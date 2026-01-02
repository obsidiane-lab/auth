import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  handleError(error: unknown): string {
    const status = this.extractStatusCode(error);
    return status ? `auth.errors.codes.${status}` : 'auth.errors.codes.UNKNOWN';
  }

  private extractStatusCode(error: unknown): number | null {
    if (!(error instanceof HttpErrorResponse)) {
      return null;
    }

    const status = error.status;
    return status > 0 ? status : null;
  }
}
