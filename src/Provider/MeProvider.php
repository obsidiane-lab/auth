<?php

namespace App\Provider;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * @implements ProviderInterface<User>
 */
final readonly class MeProvider implements ProviderInterface
{

    public function __construct(private Security $security)
    {
    }

    /**
     * @return User|null
     */
    public function provide(Operation $operation, array $uriVariables = [], array $context = []): ?User
    {
        $user = $this->security->getUser();

        return $user instanceof User ? $user : null;
    }
}
