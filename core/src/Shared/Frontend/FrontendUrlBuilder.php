<?php

namespace App\Shared\Frontend;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

final readonly class FrontendUrlBuilder
{
    private const VERIFY_EMAIL_PATH = '/verify-email';
    private const RESET_PASSWORD_PATH = '/reset-password/confirm';
    private const INVITE_COMPLETE_PATH = '/invite/complete';

    public function __construct(
        #[Autowire('%env(FRONTEND_BASE_URL)%')]
        private string $baseUrl,
    ) {
    }

    /**
     * @param array<string, scalar> $query
     */
    public function verifyEmailUrl(array $query): string
    {
        return $this->buildUrl(self::VERIFY_EMAIL_PATH, $query);
    }

    public function resetPasswordUrl(string $token): string
    {
        return $this->buildUrl(self::RESET_PASSWORD_PATH, ['token' => $token]);
    }

    public function inviteCompleteUrl(string $token): string
    {
        return $this->buildUrl(self::INVITE_COMPLETE_PATH, ['token' => $token]);
    }

    /**
     * @param array<string, scalar> $query
     */
    private function buildUrl(string $path, array $query = []): string
    {
        $base = rtrim(trim($this->baseUrl), '/');
        $url = $base . '/' . ltrim($path, '/');

        if ($query === []) {
            return $url;
        }

        $queryString = http_build_query($query, '', '&', PHP_QUERY_RFC3986);

        return $url . '?' . $queryString;
    }
}
