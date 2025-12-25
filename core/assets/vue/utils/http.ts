import axios, {
  AxiosHeaders,
  type AxiosHeaderValue,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosRequestHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';

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
  csrfTokenId?: boolean;
}

export const http: AxiosInstance = axios.create({
  withCredentials: true,
  headers: {
    Accept: 'application/ld+json, application/json',
  },
});

const generateCsrfToken = (): string => {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  return Math.random().toString(36).slice(2) + Date.now().toString(36);
};

http.interceptors.request.use(async (config) => {
  const request = config as CsrfRequestConfig;

  if (!request.csrfTokenId) {
    return config;
  }

  const token = generateCsrfToken();
  const headers = toAxiosHeaders(request.headers);
  headers.set('csrf-token', token);
  request.headers = headers;

  return request;
});

export const jsonConfig = (
  csrfTokenId?: boolean,
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
