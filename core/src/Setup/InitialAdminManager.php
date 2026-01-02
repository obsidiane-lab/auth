<?php

declare(strict_types=1);

namespace App\Setup;

use App\Dto\Auth\RegisterUserInput;
use App\Exception\Setup\InitialAdminAlreadyCreatedException;
use App\Auth\RegisterUser;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

final class InitialAdminManager
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly RegisterUser $registerUser,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function needsBootstrap(): bool
    {
        return $this->userRepository->count([]) === 0;
    }

    public function createInitialAdmin(RegisterUserInput $input): User
    {
        if (!$this->needsBootstrap()) {
            throw new InitialAdminAlreadyCreatedException();
        }

        $user = $this->registerUser->handle($input, false);
        $user->setRoles(['ROLE_ADMIN']);
        $user->setEmailVerified(true);
        $this->entityManager->flush();

        return $user;
    }
}
