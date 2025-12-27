import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { normalizeApiBaseUrl, resolveApiBaseUrl } from '../api-base-url';

const CSRF_RETRY = new HttpContextToken<boolean>(() => false);
const CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_COOKIE_NAME = 'csrf-token';

function generateCsrfToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function persistCsrfCookie(token: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const isSecure = typeof window !== 'undefined' && window.location?.protocol === 'https:';
  const prefix = isSecure ? '__Host-' : '';
  const cookieName = `${prefix}${CSRF_COOKIE_NAME}_${token}`;
  const attributes = ['Path=/', 'SameSite=Strict'];

  if (isSecure) {
    attributes.push('Secure');
  }

  document.cookie = `${cookieName}=${CSRF_COOKIE_NAME}; ${attributes.join('; ')}`;
}

const rawApiBaseUrl = normalizeApiBaseUrl(environment.apiBaseUrl);
const absoluteApiBaseUrl = normalizeApiBaseUrl(resolveApiBaseUrl(environment.apiBaseUrl));

function isApiRequest(url: string): boolean {
  if (rawApiBaseUrl !== '' && url.startsWith(rawApiBaseUrl)) {
    return true;
  }

  return absoluteApiBaseUrl !== '' && url.startsWith(absoluteApiBaseUrl);
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
  const csrfToken = needsCsrf ? generateCsrfToken() : undefined;
  if (csrfToken) {
    persistCsrfCookie(csrfToken);
  }
  const baseRequest = req.clone({
    withCredentials: true,
    ...(csrfToken ? { setHeaders: { 'csrf-token': csrfToken } } : {}),
  });

  return next(baseRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!needsCsrf || error.status !== 403 || baseRequest.context.get(CSRF_RETRY)) {
        return throwError(() => error);
      }

      const retryToken = generateCsrfToken();
      persistCsrfCookie(retryToken);
      const retryRequest = baseRequest.clone({
        setHeaders: { 'csrf-token': retryToken },
        context: baseRequest.context.set(CSRF_RETRY, true),
      });

      return next(retryRequest);
    }),
  );
};
