export function resolveRedirectTarget(fallback?: string): string | null {
  if (fallback && fallback.trim().length > 0) {
    return fallback.trim();
  }

  return null;
}

export function isInternalPath(target: string | null | undefined): target is string {
  if (!target) {
    return false;
  }

  return target.startsWith('/') && !target.startsWith('//');
}

export function normalizeInternalPath(target: string | null | undefined): string | null {
  return isInternalPath(target) ? target : null;
}
