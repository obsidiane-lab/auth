<?php

declare(strict_types=1);

namespace App\Security\ServiceToken;

use Symfony\Component\Security\Core\Exception\BadCredentialsException;
use Symfony\Component\Security\Http\AccessToken\AccessTokenHandlerInterface;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

final class ServiceTokenHandler implements AccessTokenHandlerInterface
{
    public function __construct(
        #[Autowire('%env(default::CORE_TO_AUTH_TOKEN)%')]
        private ?string $token,
    )
    {
        $this->token = $this->token !== null ? trim($this->token) : null;
    }

    public function getUserBadgeFrom(string $accessToken): UserBadge
    {
        if ($this->token !== null && $this->token !== '' && hash_equals($this->token, $accessToken)) {
            return new UserBadge('core_service');
        }

        throw new BadCredentialsException('Invalid service token.');
    }
}
