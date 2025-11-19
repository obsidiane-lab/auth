export type CsrfTokenGenerator = () => string;
/**
 * Default CSRF token generator used in browsers.
 * Generates a 32-hex-character random string when `crypto.getRandomValues` is available,
 * otherwise falls back to a pseudo-random token.
 */
export declare const defaultCsrfTokenGenerator: CsrfTokenGenerator;
/**
 * Resolve which CSRF token should be used for a request.
 * - `true`  => generate a fresh token
 * - string  => use the provided value
 * - falsy   => no CSRF header
 */
export declare const resolveCsrfTokenValue: (csrf: boolean | string | undefined, generator: CsrfTokenGenerator) => string | undefined;
