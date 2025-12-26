<?php

namespace App\Controller;

use App\Auth\Dto\PasswordForgotInput;
use App\Auth\Dto\PasswordResetInput;
use App\Entity\User;
use App\Frontend\FrontendUrlBuilder;
use App\Mail\MailDispatchException;
use App\Mail\MailerGateway;
use App\Repository\RefreshTokenRepository;
use App\Repository\UserRepository;
use App\Setup\InitialAdminManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Psr\Log\LoggerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Contracts\Translation\TranslatorInterface;
use App\Security\PasswordStrengthChecker;
use SymfonyCasts\Bundle\ResetPassword\Exception\ResetPasswordExceptionInterface;
use SymfonyCasts\Bundle\ResetPassword\ResetPasswordHelperInterface;

final class ResetPasswordController extends AbstractController
{
    public function __construct(
        private readonly ResetPasswordHelperInterface $resetPasswordHelper,
        private readonly UserRepository               $userRepository,
        private readonly RefreshTokenRepository       $refreshTokenRepository,
        private readonly UserPasswordHasherInterface  $passwordHasher,
        private readonly MailerGateway                $mailer,
        private readonly FrontendUrlBuilder           $frontendUrlBuilder,
        private readonly TranslatorInterface          $translator,
        private readonly EntityManagerInterface       $entityManager,
        private readonly InitialAdminManager          $initialAdminManager,
        private readonly PasswordStrengthChecker      $passwordStrengthChecker,
        #[Autowire('%env(string:NOTIFUSE_TEMPLATE_RESET_PASSWORD)%')]
        private readonly string                       $resetPasswordTemplateId = 'resetpass',
        private readonly LoggerInterface              $logger,
    ) {
    }

    public function request(PasswordForgotInput $input): Response
    {
        if ($this->initialAdminManager->needsBootstrap()) {
            return $this->createErrorResponse('INITIAL_ADMIN_REQUIRED', Response::HTTP_CONFLICT);
        }

        $email = trim(mb_strtolower((string) ($input->email ?? '')));

        if ($email !== '') {
            $user = $this->userRepository->findOneBy(['email' => $email]);

            if ($user instanceof User) {
                try {
                    $resetToken = $this->resetPasswordHelper->generateResetToken($user);

                    $resetUrl = $this->frontendUrlBuilder->resetPasswordUrl($resetToken->getToken());

                    $recipient = $user->getEmail() ?? $email;
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
                        'email' => $email,
                    ]);
                } catch (MailDispatchException) {
                    $this->logger->error('Password reset email send failed', [
                        'email' => $email,
                    ]);
                    return $this->createErrorResponse('EMAIL_SEND_FAILED', Response::HTTP_SERVICE_UNAVAILABLE);
                } catch (\Throwable) {
                    $this->logger->error('Password reset request failed', [
                        'email' => $email,
                    ]);
                    return $this->createErrorResponse('RESET_REQUEST_FAILED', Response::HTTP_INTERNAL_SERVER_ERROR);
                }
            } else {
                $this->logger->info('Password reset requested for unknown email (ignored)', [
                    'email' => $email,
                ]);
            }
        }

        return new JsonResponse(['status' => 'OK'], Response::HTTP_ACCEPTED);
    }

    /**
     * @return JsonResponse
     */
    private function createErrorResponse(string $errorCode, int $statusCode): JsonResponse
    {
        $payload = ['error' => $errorCode];

        $payload['message'] = $this->translator->trans(match ($errorCode) {
            'EMAIL_SEND_FAILED' => 'password.request.error.email_send_failed',
            'INITIAL_ADMIN_REQUIRED' => 'password.request.error.initial_admin_required',
            default => 'password.request.error.generic',
        });

        return new JsonResponse($payload, $statusCode);
    }

    public function reset(PasswordResetInput $input): Response
    {
        if ($this->initialAdminManager->needsBootstrap()) {
            return new JsonResponse(['error' => 'INITIAL_ADMIN_REQUIRED'], Response::HTTP_CONFLICT);
        }

        $tokenInSession = (string) ($input->token ?? '');
        $plainPassword = (string) ($input->password ?? '');

        if ($tokenInSession === '') {
            return new JsonResponse(['error' => 'INVALID_REQUEST'], Response::HTTP_BAD_REQUEST);
        }

        if ($plainPassword === '') {
            return new JsonResponse(['error' => 'EMPTY_PASSWORD'], Response::HTTP_BAD_REQUEST);
        }

        if (!$this->passwordStrengthChecker->isStrongEnough($plainPassword)) {
            return new JsonResponse(['error' => 'INVALID_PASSWORD'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $user = $this->resetPasswordHelper->validateTokenAndFetchUser($tokenInSession);
        } catch (ResetPasswordExceptionInterface) {
            return new JsonResponse(['error' => 'INVALID_TOKEN'], Response::HTTP_BAD_REQUEST);
        }

        if (!$user instanceof User) {
            return new JsonResponse(['error' => 'INVALID_USER'], Response::HTTP_BAD_REQUEST);
        }

        $user->setPassword($this->passwordHasher->hashPassword($user, $plainPassword));
        $user->eraseCredentials();
        $this->entityManager->flush();

        $this->resetPasswordHelper->removeResetRequest($tokenInSession);
        $this->refreshTokenRepository->deleteAllForUser($user->getUserIdentifier());

        $this->logger->info('Password successfully reset', [
            'user_id' => $user->getId(),
            'email' => $user->getEmail(),
        ]);

        return new Response('', Response::HTTP_NO_CONTENT);
    }

}
