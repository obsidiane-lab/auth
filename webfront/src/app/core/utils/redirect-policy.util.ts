interface RedirectOrigin {
  scheme: string;
  host: string;
  port: number | null;
}

const DEFAULT_PORTS: Record<string, number> = {
  http: 80,
  https: 443,
};

function parseUrl(value: string | null | undefined): RedirectOrigin | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return {
      scheme: url.protocol.replace(':', '').toLowerCase(),
      host: url.hostname.toLowerCase(),
      port: url.port ? Number.parseInt(url.port, 10) : null,
    };
  } catch {
    return null;
  }
}

function normalizeAllowlist(allowlist: string[]): RedirectOrigin[] {
  const origins: RedirectOrigin[] = [];
  const seen = new Set<string>();

  for (const candidate of allowlist) {
    const origin = parseUrl(candidate);
    if (!origin) {
      continue;
    }

    const key = `${origin.scheme}://${origin.host}:${origin.port ?? ''}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    origins.push(origin);
  }

  return origins;
}

function sameOrigin(candidate: RedirectOrigin, allowed: RedirectOrigin): boolean {
  if (candidate.scheme !== allowed.scheme || candidate.host !== allowed.host) {
    return false;
  }

  const candidatePort = candidate.port ?? DEFAULT_PORTS[candidate.scheme] ?? 0;
  const allowedPort = allowed.port ?? DEFAULT_PORTS[allowed.scheme] ?? 0;

  return candidatePort === allowedPort;
}

export function isAllowedRedirect(candidate: string | null | undefined, allowlist: string[]): boolean {
  const parsedCandidate = parseUrl(candidate);
  if (!parsedCandidate) {
    return false;
  }

  const allowed = normalizeAllowlist(allowlist);
  return allowed.some((origin) => sameOrigin(parsedCandidate, origin));
}

export function resolveRedirectTarget(
  candidate: string | null | undefined,
  allowlist: string[],
  fallback?: string,
): string | null {
  if (candidate && isAllowedRedirect(candidate, allowlist)) {
    return candidate;
  }

  if (fallback && fallback.trim().length > 0) {
    return fallback.trim();
  }

  return null;
}

export function isInternalPath(target: string | null | undefined): boolean {
  if (!target) {
    return false;
  }

  return target.startsWith('/') && !target.startsWith('//');
}
