<?php

namespace App\Auth\Application;

use App\Auth\Domain\Exception\PasswordResetException;
use App\Entity\User;
use App\Repository\RefreshTokenRepository;
use App\Setup\Application\InitialAdminManager;
use App\Shared\Security\PasswordStrengthChecker;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use SymfonyCasts\Bundle\ResetPassword\Exception\ResetPasswordExceptionInterface;
use SymfonyCasts\Bundle\ResetPassword\ResetPasswordHelperInterface;

final readonly class ResetPassword
{
    public function __construct(
        private ResetPasswordHelperInterface $resetPasswordHelper,
        private RefreshTokenRepository $refreshTokenRepository,
        private UserPasswordHasherInterface $passwordHasher,
        private EntityManagerInterface $entityManager,
        private InitialAdminManager $initialAdminManager,
        private PasswordStrengthChecker $passwordStrengthChecker,
        private LoggerInterface $logger,
    ) {
    }

    /**
     * @throws PasswordResetException
     */
    public function handle(?string $token, ?string $plainPassword): void
    {
        if ($this->initialAdminManager->needsBootstrap()) {
            throw new PasswordResetException('INITIAL_ADMIN_REQUIRED', 409);
        }

        $tokenValue = (string) ($token ?? '');
        $passwordValue = (string) ($plainPassword ?? '');

        if ($tokenValue === '') {
            throw new PasswordResetException('INVALID_REQUEST', 400);
        }

        if ($passwordValue === '') {
            throw new PasswordResetException('EMPTY_PASSWORD', 400);
        }

        if (!$this->passwordStrengthChecker->isStrongEnough($passwordValue)) {
            throw new PasswordResetException('INVALID_PASSWORD', 400);
        }

        try {
            $user = $this->resetPasswordHelper->validateTokenAndFetchUser($tokenValue);
        } catch (ResetPasswordExceptionInterface $exception) {
            throw new PasswordResetException('INVALID_TOKEN', 400, $exception);
        }

        if (!$user instanceof User) {
            throw new PasswordResetException('INVALID_USER', 400);
        }

        $user->setPassword($this->passwordHasher->hashPassword($user, $passwordValue));
        $user->eraseCredentials();
        $this->entityManager->flush();

        $this->resetPasswordHelper->removeResetRequest($tokenValue);
        $this->refreshTokenRepository->deleteAllForUser($user->getUserIdentifier());

        $this->logger->info('Password successfully reset', [
            'user_id' => $user->getId(),
            'email' => $user->getEmail(),
        ]);
    }
}
