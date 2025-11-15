<?php

namespace App\Security;

use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

final readonly class CsrfTokenProvider
{
    public function __construct(private CsrfTokenManagerInterface $csrfTokenManager)
    {
    }

    public function token(CsrfTokenId $id): string
    {
        return $this->csrfTokenManager->getToken($id->value)->getValue();
    }

    /**
     * @param list<CsrfTokenId> $ids
     *
     * @return array<string, string>
     */
    public function tokens(array $ids): array
    {
        $tokens = [];

        foreach ($ids as $id) {
            $tokens[$id->value] = $this->token($id);
        }

        return $tokens;
    }
}
