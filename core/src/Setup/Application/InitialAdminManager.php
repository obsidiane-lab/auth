<?php

declare(strict_types=1);

namespace App\Setup\Application;

use App\Auth\Http\Dto\RegisterUserInput;
use App\Auth\Domain\Exception\RegistrationException;
use App\Auth\Application\RegisterUser;
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

        $user = $this->registerUser->handle($input);
        $user->setRoles(['ROLE_ADMIN']);
        $user->setEmailVerified(true);
        $this->entityManager->flush();

        return $user;
    }
}
