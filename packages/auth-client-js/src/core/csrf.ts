export type CsrfTokenGenerator = () => string;
export type CsrfCookieWriter = (token: string, cookieName?: string) => void;

/**
 * Default CSRF token generator used in browsers.
 * Generates a 32-hex-character random string when `crypto.getRandomValues` is available,
 * otherwise falls back to a pseudo-random token.
 */
export const defaultCsrfTokenGenerator: CsrfTokenGenerator = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

/**
 * Persist the stateless CSRF cookie for double-submit protection.
 * The cookie name follows the Symfony stateless CSRF convention: <cookieName>_<token>=<cookieName>.
 */
export const persistCsrfCookie: CsrfCookieWriter = (token, cookieName = 'csrf-token') => {
  if (typeof document === 'undefined') {
    return;
  }

  const isSecure = typeof window !== 'undefined' && window.location?.protocol === 'https:';
  const prefix = isSecure ? '__Host-' : '';
  const name = `${prefix}${cookieName}_${token}`;
  const attributes = ['Path=/', 'SameSite=Strict'];

  if (isSecure) {
    attributes.push('Secure');
  }

  document.cookie = `${name}=${cookieName}; ${attributes.join('; ')}`;
};

/**
 * Resolve which CSRF token should be used for a request.
 * - `true`  => generate a fresh token
 * - string  => use the provided value
 * - falsy   => no CSRF header
 */
export const resolveCsrfTokenValue = (
  csrf: boolean | string | undefined,
  generator: CsrfTokenGenerator,
): string | undefined => {
  if (csrf === true) {
    return generator();
  }

  if (typeof csrf === 'string' && csrf !== '') {
    return csrf;
  }

  return undefined;
};
