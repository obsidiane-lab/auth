<?php

namespace App\Auth\Application;

use App\Entity\User;
use App\Repository\RefreshTokenRepository;
use App\Setup\Application\InitialAdminManager;
use App\Shared\Http\Exception\EmptyPasswordException;
use App\Shared\Http\Exception\InitialAdminRequiredException;
use App\Shared\Http\Exception\InvalidPasswordException;
use App\Shared\Http\Exception\InvalidRequestException;
use App\Shared\Http\Exception\InvalidTokenException;
use App\Shared\Http\Exception\InvalidUserException;
use App\Shared\Security\PasswordStrengthChecker;
use App\Shared\Security\UserPasswordUpdater;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use SymfonyCasts\Bundle\ResetPassword\Exception\ResetPasswordExceptionInterface;
use SymfonyCasts\Bundle\ResetPassword\ResetPasswordHelperInterface;

final readonly class ResetPassword
{
    public function __construct(
        private ResetPasswordHelperInterface $resetPasswordHelper,
        private RefreshTokenRepository $refreshTokenRepository,
        private UserPasswordUpdater $passwordUpdater,
        private EntityManagerInterface $entityManager,
        private InitialAdminManager $initialAdminManager,
        private PasswordStrengthChecker $passwordStrengthChecker,
        private LoggerInterface $logger,
    ) {
    }

    public function handle(?string $token, ?string $plainPassword): void
    {
        if ($this->initialAdminManager->needsBootstrap()) {
            throw new InitialAdminRequiredException();
        }

        $tokenValue = (string) ($token ?? '');
        $passwordValue = (string) ($plainPassword ?? '');

        if ($tokenValue === '') {
            throw new InvalidRequestException();
        }

        if ($passwordValue === '') {
            throw new EmptyPasswordException();
        }

        if (!$this->passwordStrengthChecker->isStrongEnough($passwordValue)) {
            throw new InvalidPasswordException();
        }

        try {
            $user = $this->resetPasswordHelper->validateTokenAndFetchUser($tokenValue);
        } catch (ResetPasswordExceptionInterface $exception) {
            throw new InvalidTokenException($exception);
        }

        if (!$user instanceof User) {
            throw new InvalidUserException();
        }

        $this->passwordUpdater->apply($user, $passwordValue);
        $this->entityManager->flush();

        $this->resetPasswordHelper->removeResetRequest($tokenValue);
        $this->refreshTokenRepository->deleteAllForUser($user->getUserIdentifier());

        $this->logger->info('Password successfully reset', [
            'user_id' => $user->getId(),
            'email' => $user->getEmail(),
        ]);
    }
}
