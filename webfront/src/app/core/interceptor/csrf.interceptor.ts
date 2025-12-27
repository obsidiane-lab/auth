import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { normalizeApiBaseUrl, resolveApiBaseUrl } from '../api-base-url';
import { FrontendConfigService } from '../services/frontend-config.service';

const CSRF_RETRY = new HttpContextToken<boolean>(() => false);
const CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
function generateCsrfToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function persistCsrfCookie(cookieName: string, token: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const isSecure = typeof window !== 'undefined' && window.location?.protocol === 'https:';
  const resolvedName = cookieName;
  const attributes = ['Path=/', 'SameSite=Strict'];

  if (isSecure) {
    attributes.push('Secure');
  }

  document.cookie = `${resolvedName}=${token}; ${attributes.join('; ')}`;
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
  const configService = inject(FrontendConfigService);
  const config = configService.config();
  const csrfCookieName = config.csrfCookieName || 'csrf-token';
  const csrfHeaderName = config.csrfHeaderName || 'csrf-token';

  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const needsCsrf = shouldAttachCsrf(req.url, req.method);
  const csrfToken = needsCsrf ? generateCsrfToken() : undefined;
  if (csrfToken) {
    persistCsrfCookie(csrfCookieName, csrfToken);
  }
  const baseRequest = req.clone({
    withCredentials: true,
    ...(csrfToken ? { setHeaders: { [csrfHeaderName]: csrfToken } } : {}),
  });

  return next(baseRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!needsCsrf || error.status !== 403 || baseRequest.context.get(CSRF_RETRY)) {
        return throwError(() => error);
      }

      const retryToken = generateCsrfToken();
      persistCsrfCookie(csrfCookieName, retryToken);
      const retryRequest = baseRequest.clone({
        setHeaders: { [csrfHeaderName]: retryToken },
        context: baseRequest.context.set(CSRF_RETRY, true),
      });

      return next(retryRequest);
    }),
  );
};
