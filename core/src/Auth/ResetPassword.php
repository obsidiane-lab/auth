<?php

namespace App\Auth;

use App\Entity\User;
use App\Repository\RefreshTokenRepository;
use App\Security\UserPasswordUpdater;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\GoneHttpException;
use SymfonyCasts\Bundle\ResetPassword\Exception\ExpiredResetPasswordTokenException;
use SymfonyCasts\Bundle\ResetPassword\Exception\InvalidResetPasswordTokenException;
use SymfonyCasts\Bundle\ResetPassword\Exception\ResetPasswordExceptionInterface;
use SymfonyCasts\Bundle\ResetPassword\ResetPasswordHelperInterface;

final readonly class ResetPassword
{
    public function __construct(
        private ResetPasswordHelperInterface $resetPasswordHelper,
        private RefreshTokenRepository $refreshTokenRepository,
        private UserPasswordUpdater $passwordUpdater,
        private EntityManagerInterface $entityManager,
        private LoggerInterface $logger,
    ) {
    }

    public function handle(string $token, string $plainPassword): void
    {
        try {
            $user = $this->resetPasswordHelper->validateTokenAndFetchUser($token);
        } catch (ExpiredResetPasswordTokenException $exception) {
            throw new GoneHttpException('Token has expired.', $exception);
        } catch (InvalidResetPasswordTokenException $exception) {
            throw new BadRequestHttpException('Invalid token.', previous: $exception);
        } catch (ResetPasswordExceptionInterface $exception) {
            throw new BadRequestHttpException('Invalid token.', previous: $exception);
        }

        if (!$user instanceof User) {
            throw new BadRequestHttpException('Invalid user.');
        }

        $this->passwordUpdater->apply($user, $plainPassword);
        $this->entityManager->flush();

        $this->resetPasswordHelper->removeResetRequest($token);
        $this->refreshTokenRepository->deleteAllForUser($user->getUserIdentifier());

        $this->logger->info('Password successfully reset', [
            'user_id' => $user->getId(),
            'email' => $user->getEmail(),
        ]);
    }
}
