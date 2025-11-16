<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

final readonly class CsrfRequestValidator
{
    private const HEADER_NAME = 'csrf-token';

    public function __construct(private CsrfTokenManagerInterface $csrfTokenManager)
    {
    }

    public function isValid(Request $request, CsrfTokenId $tokenId): bool
    {
        $tokenValue = $this->getTokenFromHeader($request);

        if ($tokenValue === null) {
            return false;
        }

        // SameOriginCsrfTokenManager expects the token in the header named after
        // the configured cookie (csrf-token). We already read from that header,
        // so we can delegate directly.

        return $this->csrfTokenManager->isTokenValid(new CsrfToken($tokenId->value, $tokenValue));
    }

    private function getTokenFromHeader(Request $request): ?string
    {
        $value = $request->headers->get(self::HEADER_NAME);

        return is_string($value) && $value !== '' ? $value : null;
    }
}
