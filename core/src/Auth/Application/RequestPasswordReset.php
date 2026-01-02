<?php

namespace App\Auth\Application;

use App\Entity\User;
use App\Shared\Frontend\FrontendUrlBuilder;
use App\Shared\Mail\MailDispatchException;
use App\Shared\Mail\MailerGateway;
use App\Repository\UserRepository;
use App\Setup\Application\InitialAdminManager;
use App\Shared\Http\Exception\InitialAdminRequiredException;
use App\Shared\Http\Exception\ResetRequestFailedException;
use App\Shared\Utils\EmailNormalizer;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use SymfonyCasts\Bundle\ResetPassword\Exception\ResetPasswordExceptionInterface;
use SymfonyCasts\Bundle\ResetPassword\ResetPasswordHelperInterface;

final readonly class RequestPasswordReset
{
    public function __construct(
        private ResetPasswordHelperInterface $resetPasswordHelper,
        private UserRepository $userRepository,
        private MailerGateway $mailer,
        private FrontendUrlBuilder $frontendUrlBuilder,
        private InitialAdminManager $initialAdminManager,
        private EmailNormalizer $emailNormalizer,
        #[Autowire('%env(string:NOTIFUSE_TEMPLATE_RESET_PASSWORD)%')]
        private string $resetPasswordTemplateId = 'resetpass',
        private LoggerInterface $logger,
    ) {
    }

    public function handle(?string $email): void
    {
        if ($this->initialAdminManager->needsBootstrap()) {
            throw new InitialAdminRequiredException();
        }

        $normalizedEmail = $this->emailNormalizer->normalize($email);
        if ($normalizedEmail === '') {
            return;
        }

        $user = $this->userRepository->findOneBy(['email' => $normalizedEmail]);

        if (!$user instanceof User) {
            $this->logger->info('Password reset requested for unknown email (ignored)', [
                'email' => $normalizedEmail,
            ]);

            return;
        }

        try {
            $resetToken = $this->resetPasswordHelper->generateResetToken($user);
            $resetUrl = $this->frontendUrlBuilder->resetPasswordUrl($resetToken->getToken());

            $recipient = $user->getEmail() ?? $normalizedEmail;
            $this->mailer->dispatch(
                $recipient,
                $this->resetPasswordTemplateId,
                [
                    'reset_link' => $resetUrl,
                ]
            );

            $this->logger->info('Password reset email dispatched', [
                'user_id' => $user->getId(),
                'email' => $recipient,
            ]);
        } catch (ResetPasswordExceptionInterface) {
            $this->logger->warning('Password reset token generation failed', [
                'email' => $normalizedEmail,
            ]);
        } catch (MailDispatchException $exception) {
            $this->logger->error('Password reset email send failed', [
                'email' => $normalizedEmail,
            ]);

            throw $exception;
        } catch (\Throwable $exception) {
            $this->logger->error('Password reset request failed', [
                'email' => $normalizedEmail,
            ]);

            throw new ResetRequestFailedException($exception);
        }
    }
}
