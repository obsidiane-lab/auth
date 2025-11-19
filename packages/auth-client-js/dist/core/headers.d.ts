import type { CsrfTokenGenerator } from './csrf';
export interface HeadersBuilderConfig {
    defaultHeaders?: HeadersInit;
    csrfHeaderName: string;
    csrfTokenGenerator: CsrfTokenGenerator;
}
export interface BuildHeadersOptions {
    requestHeaders?: HeadersInit;
    csrf?: boolean | string;
}
/**
 * Build the final headers for an HTTP request by merging:
 * - default SDK headers (including Accept),
 * - user-provided default headers from configuration,
 * - per-request headers,
 * - an optional CSRF token header.
 */
export declare const buildRequestHeaders: (config: HeadersBuilderConfig, options?: BuildHeadersOptions) => Headers;
