<?php

namespace App\Auth;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Cookie;

final readonly class TokenCookieFactory
{
    /** @var array{name: string, path: string, domain: ?string, same_site: 'lax'|'strict'|'none', secure: bool} */
    private array $accessCookieConfig;

    /** @var array{name: string, path: string, domain: ?string, same_site: 'lax'|'strict'|'none', secure: bool} */
    private array $refreshCookieConfig;

    private int $accessTtl;

    /**
     * @param array<string, mixed> $refreshCookieOptions
     */
    public function __construct(
        #[Autowire('%env(string:ACCESS_COOKIE_NAME)%')] string $accessCookieName,
        #[Autowire('%env(string:ACCESS_COOKIE_PATH)%')] string $accessCookiePath,
        #[Autowire('%env(string:ACCESS_COOKIE_DOMAIN)%')] string $accessCookieDomain,
        #[Autowire('%env(string:ACCESS_COOKIE_SAMESITE)%')] string $accessCookieSameSite,
        #[Autowire('%env(bool:ACCESS_COOKIE_SECURE)%')] bool $accessCookieSecure,
        #[Autowire('%gesdinet_jwt_refresh_token.token_parameter_name%')] string $refreshCookieName,
        /** @var array<string, mixed> $refreshCookieOptions */
        #[Autowire('%gesdinet_jwt_refresh_token.cookie%')] array $refreshCookieOptions,
        #[Autowire('%env(int:JWT_ACCESS_TTL)%')] int $accessTtl,
    ) {
        $this->accessCookieConfig = $this->buildCookieConfig(
            $accessCookieName,
            $accessCookiePath,
            $accessCookieDomain,
            $accessCookieSameSite,
            $accessCookieSecure,
            '__Secure-at'
        );
        $this->refreshCookieConfig = $this->buildCookieConfig(
            $refreshCookieName,
            (string) ($refreshCookieOptions['path'] ?? '/'),
            (string) ($refreshCookieOptions['domain'] ?? ''),
            (string) ($refreshCookieOptions['same_site'] ?? 'lax'),
            (bool) ($refreshCookieOptions['secure'] ?? true),
            $refreshCookieName
        );
        $this->accessTtl = $accessTtl;
    }

    public function createAccessTokenCookie(string $token): Cookie
    {
        return $this->createCookie($this->accessCookieConfig, $token, $this->accessTtl);
    }

    public function expireCookie(string $name, bool $httpOnly = true): Cookie
    {
        $config = $this->matchCookieConfig($name);

        return $this->createCookie($config, '', -3600, $httpOnly);
    }

    public function getAccessCookieName(): string
    {
        return $this->accessCookieConfig['name'];
    }

    public function getAccessTtl(): int
    {
        return $this->accessTtl;
    }

    public function getRefreshCookieName(): string
    {
        return $this->refreshCookieConfig['name'];
    }

    public function expireRefreshCookie(): Cookie
    {
        return $this->createCookie($this->refreshCookieConfig, '', -3600);
    }

    /**
     * @param array{name: string, path: string, domain: ?string, same_site: 'lax'|'strict'|'none', secure: bool} $config
     */
    private function createCookie(array $config, string $value, int $ttl, bool $httpOnly = true): Cookie
    {
        $expiresAt = $this->expiryFromTtl($ttl);

        return new Cookie(
            $config['name'],
            $value,
            $expiresAt,
            $config['path'],
            $config['domain'],
            $config['secure'],
            $httpOnly,
            false,
            $config['same_site']
        );
    }

    private function expiryFromTtl(int $ttl): int
    {
        if (0 === $ttl) {
            return 0;
        }

        return time() + $ttl;
    }

    /**
     * @return array{name: string, path: string, domain: ?string, same_site: 'lax'|'strict'|'none', secure: bool}
     */
    private function buildCookieConfig(
        string $rawName,
        string $rawPath,
        string $rawDomain,
        string $rawSameSite,
        bool $secure,
        string $fallback
    ): array {
        $name = $this->sanitizeName($rawName, $fallback);
        $path = $this->sanitizePath($rawPath, '/');
        $domain = $this->sanitizeDomain($rawDomain);
        $sameSite = $this->normalizeSameSite($rawSameSite);

        if (str_starts_with($name, '__Secure-')) {
            $secure = true;
        }

        if (str_starts_with($name, '__Host-')) {
            $secure = true;
            $domain = null; // host-only
            $path = '/';
        }

        return [
            'name' => $name,
            'path' => $path,
            'domain' => $domain,
            'same_site' => $sameSite,
            'secure' => $secure,
        ];
    }

    /**
     * @param string $value
     * @return 'lax'|'strict'|'none'
     */
    private function normalizeSameSite(string $value): string
    {
        return match (strtolower(trim($value))) {
            'lax' => Cookie::SAMESITE_LAX,
            'strict' => Cookie::SAMESITE_STRICT,
            'none' => Cookie::SAMESITE_NONE,
            default => Cookie::SAMESITE_LAX,
        };
    }

    private function sanitizeName(string $name, string $fallback): string
    {
        $trimmed = trim($name);

        return $trimmed !== '' ? $trimmed : $fallback;
    }

    private function sanitizePath(string $path, string $fallback): string
    {
        $trimmed = trim($path);

        return $trimmed !== '' ? $trimmed : $fallback;
    }

    private function sanitizeDomain(string $domain): ?string
    {
        $trimmed = trim($domain);

        return $trimmed !== '' ? $trimmed : null;
    }

    /**
     * @return array{name: string, path: string, domain: ?string, same_site: 'lax'|'strict'|'none', secure: bool}
     */
    private function matchCookieConfig(string $name): array
    {
        if ($name === $this->accessCookieConfig['name']) {
            return $this->accessCookieConfig;
        }

        throw new \RuntimeException(sprintf('Unknown cookie configuration for "%s".', $name));
    }
}
