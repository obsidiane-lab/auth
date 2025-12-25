<?php

namespace App\Auth;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

final readonly class RedirectPolicy
{
    /** @var list<array{scheme: string, host: string, port: int|null}> */
    private array $allowedOrigins;
    private string $defaultRedirect;

    public function __construct(
        #[Autowire('%env(string:FRONTEND_REDIRECT_ALLOWLIST)%')] string $allowListRaw,
        #[Autowire('%env(string:FRONTEND_DEFAULT_REDIRECT)%')] string $defaultRedirect,
    ) {
        $this->allowedOrigins = $this->parseAllowList($allowListRaw);
        $this->defaultRedirect = $defaultRedirect;
    }

    public function isAllowed(?string $candidate): bool
    {
        $cand = $this->parseUrl($candidate);

        if (null === $cand) {
            return false;
        }

        foreach ($this->allowedOrigins as $allowed) {
            if ($this->sameOrigin($cand, $allowed)) {
                return true;
            }
        }

        return false;
    }

    public function getDefaultRedirect(): string
    {
        return $this->defaultRedirect;
    }

    /**
     * Parse a comma-separated allowlist of origins (full URLs also accepted, path ignored).
     *
     * @return list<array{scheme: string, host: string, port: int|null}>
     */
    private function parseAllowList(string $rawList): array
    {
        if ('' === trim($rawList)) {
            return [];
        }

        $candidates = array_map('trim', explode(',', $rawList));
        $allowed = [];

        foreach ($candidates as $candidate) {
            $parts = $this->parseUrl($candidate);

            if (null !== $parts) {
                $allowed[] = $parts;
            }
        }

        // unique by scheme+host+port
        $unique = [];
        $seen = [];

        foreach ($allowed as $origin) {
            $key = sprintf('%s://%s:%s', $origin['scheme'], $origin['host'], (string)($origin['port'] ?? ''));

            if (!isset($seen[$key])) {
                $seen[$key] = true;
                $unique[] = $origin;
            }
        }

        return $unique;
    }

    /**
     * @return array{scheme: string, host: string, port: int|null}|null
     */
    private function parseUrl(?string $value): ?array
    {
        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        $parts = parse_url(trim($value));
        if (!$parts || !isset($parts['scheme'], $parts['host'])) {
            return null;
        }

        $scheme = strtolower((string) $parts['scheme']);
        $host = strtolower((string) $parts['host']);
        $port = isset($parts['port']) ? (int) $parts['port'] : null;

        return [
            'scheme' => $scheme,
            'host' => $host,
            'port' => $port,
        ];
    }

    /**
     * Determine if two URL parts share the same origin.
     * If the allowed origin doesn't specify a port, default ports are assumed (80/443).
     *
     * @param array{scheme: string, host: string, port: int|null} $candidate
     * @param array{scheme: string, host: string, port: int|null} $allowed
     */
    private function sameOrigin(array $candidate, array $allowed): bool
    {
        if ($candidate['scheme'] !== $allowed['scheme']) {
            return false;
        }

        if ($candidate['host'] !== $allowed['host']) {
            return false;
        }

        $candPort = $candidate['port'] ?? $this->defaultPort($candidate['scheme']);
        $allowPort = $allowed['port'] ?? $this->defaultPort($allowed['scheme']);

        return $candPort === $allowPort;
    }

    private function defaultPort(string $scheme): int
    {
        return match ($scheme) {
            'https' => 443,
            'http' => 80,
            default => 0,
        };
    }
}
