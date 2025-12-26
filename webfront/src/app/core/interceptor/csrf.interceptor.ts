import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

const CSRF_RETRY = new HttpContextToken<boolean>(() => false);
const CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function generateCsrfToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function isApiRequest(url: string): boolean {
  const prefix = environment.apiBaseUrl.replace(/\/$/, '');
  return url.startsWith(prefix);
}

function shouldAttachCsrf(url: string, method: string): boolean {
  if (!CSRF_METHODS.has(method)) {
    return false;
  }
  if (!isApiRequest(url)) {
    return false;
  }

  return !url.includes('/auth/refresh');
}

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const needsCsrf = shouldAttachCsrf(req.url, req.method);
  const baseRequest = req.clone({
    withCredentials: true,
    ...(needsCsrf ? { setHeaders: { 'csrf-token': generateCsrfToken() } } : {}),
  });

  return next(baseRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!needsCsrf || error.status !== 403 || baseRequest.context.get(CSRF_RETRY)) {
        return throwError(() => error);
      }

      const retryRequest = baseRequest.clone({
        setHeaders: { 'csrf-token': generateCsrfToken() },
        context: baseRequest.context.set(CSRF_RETRY, true),
      });

      return next(retryRequest);
    }),
  );
};
