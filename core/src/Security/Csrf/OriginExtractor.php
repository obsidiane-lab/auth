<?php

declare(strict_types=1);

namespace App\Security\Csrf;

use Symfony\Component\HttpFoundation\Request;

final class OriginExtractor
{
    public function extractOrigin(Request $request): ?string
    {
        $origin = $request->headers->get('Origin');
        if (is_string($origin) && $origin !== '') {
            return $this->normalizeToOrigin($origin);
        }

        $referer = $request->headers->get('Referer');
        if (is_string($referer) && $referer !== '') {
            return $this->normalizeToOrigin($referer);
        }

        return null;
    }

    private function normalizeToOrigin(string $value): ?string
    {
        $parts = parse_url($value);
        if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
            return null;
        }

        $scheme = strtolower((string) $parts['scheme']);
        $host = strtolower((string) $parts['host']);
        $port = isset($parts['port']) ? ':'.(int) $parts['port'] : '';

        return $scheme.'://'.$host.$port;
    }
}
