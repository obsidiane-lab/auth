/**
 * Default CSRF token generator used in browsers.
 * Generates a 32-hex-character random string when `crypto.getRandomValues` is available,
 * otherwise falls back to a pseudo-random token.
 */
export const defaultCsrfTokenGenerator = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    }
    return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};
/**
 * Resolve which CSRF token should be used for a request.
 * - `true`  => generate a fresh token
 * - string  => use the provided value
 * - falsy   => no CSRF header
 */
export const resolveCsrfTokenValue = (csrf, generator) => {
    if (csrf === true) {
        return generator();
    }
    if (typeof csrf === 'string' && csrf !== '') {
        return csrf;
    }
    return undefined;
};
//# sourceMappingURL=csrf.js.map