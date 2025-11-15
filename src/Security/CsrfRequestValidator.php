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

        return $this->csrfTokenManager->isTokenValid(new CsrfToken($tokenId->value, $tokenValue));
    }

    private function getTokenFromHeader(Request $request): ?string
    {
        $value = $request->headers->get($this->headerName);

        return is_string($value) && $value !== '' ? $value : null;
    }
}
