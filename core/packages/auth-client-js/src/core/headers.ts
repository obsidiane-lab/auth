import type { CsrfTokenGenerator } from './csrf';
import { resolveCsrfTokenValue } from './csrf';

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
export const buildRequestHeaders = (
  config: HeadersBuilderConfig,
  options: BuildHeadersOptions = {},
): Headers => {
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

const mergeHeaders = (target: Headers, init?: HeadersInit): void => {
  if (!init) {
    return;
  }

  const source = new Headers(init);
  source.forEach((value, key) => {
    target.set(key, value);
  });
};

