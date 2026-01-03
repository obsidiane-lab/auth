<?php

namespace App\Dto\User;

use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

final class UpdateUserRolesInput
{
    /**
     * @var list<string>|null
     */
    #[Assert\NotNull(message: 'INVALID_ROLES')]
    #[Assert\Type(type: 'array', message: 'INVALID_ROLES')]
    #[Assert\All([
        new Assert\Type(type: 'string', message: 'INVALID_ROLES'),
        new Assert\Regex(
            pattern: '/^\s*ROLE_[A-Z0-9_]+\s*$/i',
            message: 'INVALID_ROLES',
        ),
    ])]
    #[Groups(['user:roles'])]
    public ?array $roles = null;
}
