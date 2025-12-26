export function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.trim();

  if (trimmed === '') {
    return trimmed;
  }

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

export function resolveApiBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();

  if (trimmed === '') {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost:8000';

  return new URL(trimmed, origin).toString();
}
