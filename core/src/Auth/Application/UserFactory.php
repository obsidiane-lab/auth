<?php

namespace App\Auth\Application;

use App\Entity\User;
use App\Shared\Security\UserPasswordUpdater;
use App\Shared\Utils\EmailNormalizer;

final readonly class UserFactory
{
    public function __construct(
        private EmailNormalizer $emailNormalizer,
        private UserPasswordUpdater $passwordUpdater,
    ) {
    }

    /**
     * @param list<string> $roles
     */
    public function create(string $email, string $plainPassword, array $roles = [], bool $emailVerified = false): User
    {
        $user = new User();
        $user->setEmail($this->emailNormalizer->normalize($email));
        $this->passwordUpdater->apply($user, $plainPassword);
        $user->setRoles($roles);
        $user->setEmailVerified($emailVerified);

        return $user;
    }

    /**
     * @param list<string> $roles
     */
    public function createWithRandomPassword(string $email, array $roles = [], bool $emailVerified = false): User
    {
        $user = new User();
        $user->setEmail($this->emailNormalizer->normalize($email));
        $this->passwordUpdater->applyRandom($user);
        $user->setRoles($roles);
        $user->setEmailVerified($emailVerified);

        return $user;
    }
}
