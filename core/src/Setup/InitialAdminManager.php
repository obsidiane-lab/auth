<?php

declare(strict_types=1);

namespace App\Setup;

use App\Auth\Dto\RegisterUserInput;
use App\Auth\Exception\RegistrationException;
use App\Auth\UserRegistration;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

final class InitialAdminManager
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly UserRegistration $registration,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function needsBootstrap(): bool
    {
        $count = (int) $this->userRepository
            ->createQueryBuilder('u')
            ->select('COUNT(u.id)')
            ->getQuery()
            ->getSingleScalarResult();

        return $count === 0;
    }

    /**
     * @throws RegistrationException|\LogicException
     */
    public function createInitialAdmin(RegisterUserInput $input): User
    {
        if (!$this->needsBootstrap()) {
            throw new \LogicException('Initial administrator already created.');
        }

        $user = $this->registration->register($input);
        $user->setRoles(['ROLE_ADMIN']);
        $user->setEmailVerified(true);
        $this->entityManager->flush();

        return $user;
    }
}
