import { resolveCsrfTokenValue } from './csrf';
/**
 * Build the final headers for an HTTP request by merging:
 * - default SDK headers (including Accept),
 * - user-provided default headers from configuration,
 * - per-request headers,
 * - an optional CSRF token header.
 */
export const buildRequestHeaders = (config, options = {}) => {
    const headers = new Headers();
    headers.set('Accept', 'application/ld+json, application/json');
    mergeHeaders(headers, config.defaultHeaders);
    mergeHeaders(headers, options.requestHeaders);
    const csrfValue = resolveCsrfTokenValue(options.csrf, config.csrfTokenGenerator);
    if (csrfValue !== undefined) {
        headers.set(config.csrfHeaderName, csrfValue);
    }
    return headers;
};
const mergeHeaders = (target, init) => {
    if (!init) {
        return;
    }
    const source = new Headers(init);
    source.forEach((value, key) => {
        target.set(key, value);
    });
};
//# sourceMappingURL=headers.js.map