import { buildRequestHeaders } from './headers';
import { decodeJsonResponse } from './response';
import {
  defaultCsrfTokenGenerator,
  persistCsrfCookie,
  resolveCsrfTokenValue,
  type CsrfTokenGenerator,
} from './csrf';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  headers?: HeadersInit;
  json?: unknown;
  body?: BodyInit | null;
  /**
   * When true, a fresh CSRF token is generated and sent.
   * When a string, it is used as CSRF token value.
   */
  csrf?: boolean | string;
  signal?: AbortSignal;
}

export interface AuthClientConfig {
  baseUrl: string;
  defaultHeaders?: HeadersInit;
  credentials?: RequestCredentials;
  csrfHeaderName?: string;
  /**
   * Optional custom CSRF token generator.
   * If omitted, a secure browser-friendly generator is used.
   */
  csrfTokenGenerator?: CsrfTokenGenerator;
  /**
   * For testing or advanced usage, a custom fetch implementation can be provided.
   * In browsers, the global fetch is used by default.
   */
  fetchImpl?: typeof fetch;
}

/**
 * Low-level HTTP client used by the SDK.
 * Delegates CSRF generation, header construction and response decoding
 * to dedicated helpers for better separation of concerns.
 *
 * @internal
 */
export class InternalHttpClient {
  public readonly baseUrl: string;
  public readonly credentials: RequestCredentials;
  public readonly csrfHeaderName: string;

  private readonly defaultHeaders: HeadersInit;
  private readonly csrfTokenGenerator: CsrfTokenGenerator;
  private readonly fetchImpl: typeof fetch;

  constructor(config: AuthClientConfig) {
    if (!config.baseUrl) {
      throw new Error('AuthClient: "baseUrl" is required');
    }

    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.credentials = config.credentials ?? 'include';
    this.csrfHeaderName = config.csrfHeaderName ?? 'csrf-token';
    this.defaultHeaders = config.defaultHeaders ?? {};
    this.csrfTokenGenerator = config.csrfTokenGenerator ?? defaultCsrfTokenGenerator;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  /**
   * Expose the CSRF token generator so callers can generate compatible tokens
   * for custom requests when needed.
   */
  generateCsrfToken(): string {
    return this.csrfTokenGenerator();
  }

  async request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.baseUrl + path;

    const csrfToken = resolveCsrfTokenValue(options.csrf, this.csrfTokenGenerator);
    if (csrfToken) {
      persistCsrfCookie(csrfToken, this.csrfHeaderName);
    }

    const headers = buildRequestHeaders(
      {
        defaultHeaders: this.defaultHeaders,
        csrfHeaderName: this.csrfHeaderName,
        csrfTokenGenerator: this.csrfTokenGenerator,
      },
      {
        requestHeaders: options.headers,
        csrf: csrfToken ?? options.csrf,
      },
    );

    let body: BodyInit | null | undefined;
    if (options.json !== undefined) {
      headers.set('Content-Type', 'application/ld+json');
      body = JSON.stringify(options.json);
    } else if (options.body !== undefined) {
      body = options.body;
    }

    const response = await this.fetchImpl(url, {
      method,
      headers,
      credentials: this.credentials,
      body,
      signal: options.signal,
    });

    return decodeJsonResponse<T>(response);
  }
}
