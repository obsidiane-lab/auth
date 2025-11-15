import axios, {
  AxiosHeaders,
  type AxiosHeaderValue,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosRequestHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { CsrfTokenId, CsrfTokens } from '../types/security';

const CSRF_ENDPOINT_BASE = '/api/auth/csrf';
const csrfTokens: Partial<Record<CsrfTokenId, string>> = {};

const toAxiosHeaders = (headers?: unknown): AxiosHeaders => {
  const normalized = new AxiosHeaders();

  if (!headers) {
    return normalized;
  }

  if (headers instanceof AxiosHeaders) {
    return toAxiosHeaders(headers.toJSON());
  }

  if (typeof headers !== 'object') {
    return normalized;
  }

  const entries = headers as Record<string, unknown>;

  Object.entries(entries).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    const headerValue = Array.isArray(value)
      ? value.join(', ')
      : (value as AxiosHeaderValue);

    normalized.set(key, headerValue);
  });

  return normalized;
};

export interface CsrfRequestConfig extends InternalAxiosRequestConfig {
  csrfTokenId?: CsrfTokenId;
  _csrfRetry?: boolean;
}

export const http: AxiosInstance = axios.create({
  withCredentials: true,
  headers: {
    Accept: 'application/ld+json, application/json',
  },
});

export const initializeCsrfTokens = (tokens?: Partial<CsrfTokens>): void => {
  if (!tokens) {
    return;
  }

  Object.entries(tokens).forEach(([key, value]) => {
    if (typeof value === 'string' && value !== '') {
      csrfTokens[key] = value;
    }
  });
};

export const setCsrfToken = (tokenId: CsrfTokenId, token: string): void => {
  csrfTokens[tokenId] = token;
};

export const getCsrfToken = (tokenId: CsrfTokenId): string | undefined => csrfTokens[tokenId];

async function refreshCsrfToken(tokenId: CsrfTokenId): Promise<string> {
  const response = await http.get(`${CSRF_ENDPOINT_BASE}/${tokenId}`);
  const token = response.data?.token;

  if (typeof token !== 'string' || token === '') {
    throw new Error('Unable to refresh CSRF token.');
  }

  setCsrfToken(tokenId, token);

  return token;
}

async function ensureCsrfToken(tokenId: CsrfTokenId): Promise<string> {
  const stored = getCsrfToken(tokenId);

  if (stored) {
    return stored;
  }

  return refreshCsrfToken(tokenId);
}

http.interceptors.request.use(async (config) => {
  const request = config as CsrfRequestConfig;

  if (!request.csrfTokenId) {
    return config;
  }

  const token = await ensureCsrfToken(request.csrfTokenId);
  const headers = toAxiosHeaders(request.headers);
  headers.set('X-CSRF-TOKEN', token);
  request.headers = headers;

  return request;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as CsrfRequestConfig | undefined;

    if (request?.csrfTokenId && !request._csrfRetry && error.response?.status === 403) {
      request._csrfRetry = true;
      const token = await refreshCsrfToken(request.csrfTokenId);
      const headers = toAxiosHeaders(request.headers);
      headers.set('X-CSRF-TOKEN', token);
      request.headers = headers;

      return http(request);
    }

    return Promise.reject(error);
  },
);

export const jsonConfig = (
  csrfTokenId?: CsrfTokenId,
  config: AxiosRequestConfig = {},
): CsrfRequestConfig => {
  const headers = toAxiosHeaders(config.headers);
  headers.set('Content-Type', 'application/json');

  const merged: CsrfRequestConfig = {
    ...config,
    headers,
  };

  if (csrfTokenId) {
    merged.csrfTokenId = csrfTokenId;
  }

  return merged;
};
