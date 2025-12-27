import { buildRequestHeaders } from './headers';
import { decodeJsonResponse } from './response';
import { defaultCsrfTokenGenerator, persistCsrfCookie, resolveCsrfTokenValue, } from './csrf';
/**
 * Low-level HTTP client used by the SDK.
 * Delegates CSRF generation, header construction and response decoding
 * to dedicated helpers for better separation of concerns.
 *
 * @internal
 */
export class InternalHttpClient {
    constructor(config) {
        var _a, _b, _c, _d, _e;
        if (!config.baseUrl) {
            throw new Error('AuthClient: "baseUrl" is required');
        }
        this.baseUrl = config.baseUrl.replace(/\/+$/, '');
        this.credentials = (_a = config.credentials) !== null && _a !== void 0 ? _a : 'include';
        this.csrfHeaderName = (_b = config.csrfHeaderName) !== null && _b !== void 0 ? _b : 'csrf-token';
        this.defaultHeaders = (_c = config.defaultHeaders) !== null && _c !== void 0 ? _c : {};
        this.csrfTokenGenerator = (_d = config.csrfTokenGenerator) !== null && _d !== void 0 ? _d : defaultCsrfTokenGenerator;
        this.fetchImpl = (_e = config.fetchImpl) !== null && _e !== void 0 ? _e : fetch;
    }
    /**
     * Expose the CSRF token generator so callers can generate compatible tokens
     * for custom requests when needed.
     */
    generateCsrfToken() {
        return this.csrfTokenGenerator();
    }
    async request(method, path, options = {}) {
        const url = this.baseUrl + path;
        const csrfToken = resolveCsrfTokenValue(options.csrf, this.csrfTokenGenerator);
        if (csrfToken) {
            persistCsrfCookie(csrfToken, this.csrfHeaderName);
        }
        const headers = buildRequestHeaders({
            defaultHeaders: this.defaultHeaders,
            csrfHeaderName: this.csrfHeaderName,
            csrfTokenGenerator: this.csrfTokenGenerator,
        }, {
            requestHeaders: options.headers,
            csrf: csrfToken !== null && csrfToken !== void 0 ? csrfToken : options.csrf,
        });
        let body;
        if (options.json !== undefined) {
            headers.set('Content-Type', 'application/ld+json');
            body = JSON.stringify(options.json);
        }
        else if (options.body !== undefined) {
            body = options.body;
        }
        const response = await this.fetchImpl(url, {
            method,
            headers,
            credentials: this.credentials,
            body,
            signal: options.signal,
        });
        return decodeJsonResponse(response);
    }
}
//# sourceMappingURL=httpClient.js.map