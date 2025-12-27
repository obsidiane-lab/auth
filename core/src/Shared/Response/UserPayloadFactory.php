<?php

namespace App\Shared\Response;

use App\Entity\User;

final class UserPayloadFactory
{
    /**
     * @return array{id: int|null, email: string|null, roles: list<string>, emailVerified: bool, lastLoginAt: string|null}
     */
    public function create(User $user): array
    {
        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'roles' => $user->getRoles(),
            'emailVerified' => $user->isEmailVerified(),
            'lastLoginAt' => $user->getLastLoginAt()?->format(DATE_ATOM),
        ];
    }
}
