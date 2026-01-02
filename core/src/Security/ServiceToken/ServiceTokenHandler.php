<?php

declare(strict_types=1);

namespace App\Security\ServiceToken;

use Symfony\Component\Security\Core\Exception\BadCredentialsException;
use Symfony\Component\Security\Http\AccessToken\AccessTokenHandlerInterface;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

final class ServiceTokenHandler implements AccessTokenHandlerInterface
{
    /**
     * @param list<string> $allowedTokens
     */
    public function __construct(
        #[Autowire('%env(default::CORE_TO_AUTH_TOKEN)%')]
        private ?string $primaryToken,
        #[Autowire('%env(default::CORE_TO_AUTH_TOKEN_NEXT)%')]
        private ?string $nextToken = null,
    )
    {
    }

    public function getUserBadgeFrom(string $accessToken): UserBadge
    {
        $allowedTokens = [$this->primaryToken ?? '', $this->nextToken ?? ''];

        foreach ($allowedTokens as $allowed) {
            $allowed = trim($allowed);
            if ($allowed !== '' && hash_equals($allowed, $accessToken)) {
                return new UserBadge('core_service');
            }
        }

        throw new BadCredentialsException('Invalid service token.');
    }
}
