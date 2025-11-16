<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

final readonly class CsrfRequestValidator
{
    private const DEFAULT_HEADER = 'X-CSRF-TOKEN';

    public function __construct(
        private CsrfTokenManagerInterface $csrfTokenManager,
        private string $headerName = self::DEFAULT_HEADER,
    ) {
    }

    public function isValid(Request $request, CsrfTokenId $tokenId): bool
    {
        $tokenValue = $this->getTokenFromHeader($request);

        if ($tokenValue === null) {
            return false;
        }

        // Ensure compatibility with Symfony's SameOriginCsrfTokenManager, which expects
        // the actual CSRF token to be carried in the header named after the cookie
        // (e.g. "csrf-token") while we expose it via a dedicated header (X-CSRF-TOKEN).
        $request->headers->set('csrf-token', $tokenValue);

        return $this->csrfTokenManager->isTokenValid(new CsrfToken($tokenId->value, $tokenValue));
    }

    private function getTokenFromHeader(Request $request): ?string
    {
        $value = $request->headers->get($this->headerName);

        if (!is_string($value) || $value === '') {
            // Also accept the cookie-name header used by SameOriginCsrfTokenManager
            $value = $request->headers->get('csrf-token');
        }

        return is_string($value) && $value !== '' ? $value : null;
    }
}
