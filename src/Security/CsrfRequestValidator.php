<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

final readonly class CsrfRequestValidator
{
    private const string HEADER_NAME = 'csrf-token';
    private const int TOKEN_MIN_LENGTH = 24;

    public function __construct(
        #[Autowire('%env(string:ALLOWED_ORIGINS)%')]
        private string $allowedOriginsPattern,
    )
    {
    }

    public function isValid(Request $request): bool
    {
        $tokenValue = $this->getTokenFromHeader($request);

        if ($tokenValue === null || \strlen($tokenValue) < self::TOKEN_MIN_LENGTH) {
            return false;
        }

        if (!$this->isAllowedOrigin($request)) {
            return false;
        }

        return $this->isValidDoubleSubmit($request, $tokenValue);
    }

    private function getTokenFromHeader(Request $request): ?string
    {
        $value = $request->headers->get(self::HEADER_NAME);

        return is_string($value) && $value !== '' ? $value : null;
    }

    private function isAllowedOrigin(Request $request): bool
    {
        $origin = $this->getRequestOrigin($request);

        if ($origin === null) {
            return false;
        }

        $target = $request->getSchemeAndHttpHost() . '/';

        if (str_starts_with($origin . '/', $target)) {
            return true;
        }

        $pattern = trim($this->allowedOriginsPattern);

        if ($pattern === '') {
            return false;
        }

        $delimiter = '#';
        $escaped = str_replace($delimiter, '\\' . $delimiter, $pattern);
        $regex = $delimiter . $escaped . $delimiter;

        $result = @preg_match($regex, $origin);

        return $result === 1;
    }

    private function getRequestOrigin(Request $request): ?string
    {
        $origin = $request->headers->get('Origin');

        if (is_string($origin) && $origin !== '') {
            return $origin;
        }

        $referer = $request->headers->get('Referer');

        if (!is_string($referer) || $referer === '') {
            return null;
        }

        // Extract scheme + host from referer
        $parts = parse_url($referer);

        if (!is_array($parts) || !isset($parts['scheme'], $parts['host'])) {
            return null;
        }

        $port = isset($parts['port']) ? ':' . $parts['port'] : '';

        return sprintf('%s://%s%s', $parts['scheme'], $parts['host'], $port);
    }

    private function isValidDoubleSubmit(Request $request, string $tokenValue): bool
    {
        $headerValue = $request->headers->get(self::HEADER_NAME);

        if (!is_string($headerValue) || $headerValue !== $tokenValue) {
            return false;
        }

        $baseName = ($request->isSecure() ? '__Host-' : '') . 'csrf-token';
        $cookieName = $baseName . '_' . $tokenValue;
        $cookieValue = $request->cookies->get($cookieName);

        if ($cookieValue === null) {
            return true;
        }

        return $cookieValue === 'csrf-token';
    }
}
