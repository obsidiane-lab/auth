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
     * @var list<string>
     */
    private array $allowedTokens;

    public function __construct(
        #[Autowire('%env(default::CORE_TO_AUTH_TOKEN)%')]
        private ?string $primaryToken,
        #[Autowire('%env(default::CORE_TO_AUTH_TOKEN_NEXT)%')]
        private ?string $nextToken = null,
    )
    {
        $tokens = array_filter([
            $this->primaryToken,
            $this->nextToken,
        ], static fn (?string $token) => $token !== null && trim($token) !== '');

        $this->allowedTokens = array_values(array_map('trim', $tokens));
    }

    public function getUserBadgeFrom(string $accessToken): UserBadge
    {
        foreach ($this->allowedTokens as $allowed) {
            if (hash_equals($allowed, $accessToken)) {
                return new UserBadge('core_service');
            }
        }

        throw new BadCredentialsException('Invalid service token.');
    }
}
