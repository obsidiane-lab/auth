<?php

namespace App\Controller;

use App\Auth\View\AuthViewPropsBuilder;
use App\Config\FeatureFlags;
use App\Entity\User;
use App\Mail\MailDispatchException;
use App\Mail\MailerGateway;
use App\Repository\RefreshTokenRepository;
use App\Repository\UserRepository;
use App\Setup\InitialAdminManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Contracts\Translation\TranslatorInterface;
use App\Security\PasswordStrengthChecker;
use SymfonyCasts\Bundle\ResetPassword\Exception\ResetPasswordExceptionInterface;
use SymfonyCasts\Bundle\ResetPassword\ResetPasswordHelperInterface;

#[Route('/reset-password')]
final class ResetPasswordController extends AbstractController
{
    private const RESET_TOKEN_SESSION_KEY = 'app_reset_password_token';

    public function __construct(
        private readonly ResetPasswordHelperInterface $resetPasswordHelper,
        private readonly UserRepository               $userRepository,
        private readonly RefreshTokenRepository       $refreshTokenRepository,
        private readonly UserPasswordHasherInterface  $passwordHasher,
        private readonly MailerGateway                $mailer,
        private readonly UrlGeneratorInterface        $urlGenerator,
        private readonly TranslatorInterface          $translator,
        private readonly EntityManagerInterface       $entityManager,
        private readonly FeatureFlags                 $featureFlags,
        private readonly AuthViewPropsBuilder         $viewPropsBuilder,
        private readonly InitialAdminManager          $initialAdminManager,
        private readonly PasswordStrengthChecker      $passwordStrengthChecker,
    ) {
    }

    #[Route('', name: 'app_forgot_password_request', methods: ['GET', 'POST'])]
    public function request(Request $request): Response
    {
        if ($this->initialAdminManager->needsBootstrap()) {
            if ($request->isMethod('GET')) {
                return $this->redirectToRoute('setup_admin_page');
            }

            return $this->createErrorResponse('INITIAL_ADMIN_REQUIRED', Response::HTTP_CONFLICT);
        }

        if ($request->isMethod('GET')) {
            if (!$this->featureFlags->isUiEnabled()) {
                throw new NotFoundHttpException();
            }

        $context = $this->viewPropsBuilder->build($request);

            return $this->render('reset_password/request.html.twig', [
                'component_props' => $context['props'],
                'theme_color' => $context['theme_color'],
                'theme_mode' => $context['theme_mode'],
            ]);
        }

        // JSON submission from Vue component / API client
        $data = $this->decodeJson($request);
        $email = isset($data['email']) ? trim(mb_strtolower((string) $data['email'])) : '';

        if ($email !== '') {
            $user = $this->userRepository->findOneBy(['email' => $email]);

            if ($user instanceof User) {
                try {
                    $resetToken = $this->resetPasswordHelper->generateResetToken($user);

                    $resetUrl = $this->urlGenerator->generate(
                        'app_reset_password',
                        ['token' => $resetToken->getToken()],
                        UrlGeneratorInterface::ABSOLUTE_URL
                    );

                    $recipient = $user->getEmail() ?? $email;
                    $this->mailer->dispatch(
                        $recipient,
                        'resetpass',
                        [
                            'reset_link' => $resetUrl,
                        ]
                    );
                } catch (ResetPasswordExceptionInterface) {

                } catch (MailDispatchException) {
                    return $this->createErrorResponse('EMAIL_SEND_FAILED', Response::HTTP_SERVICE_UNAVAILABLE);
                } catch (\Throwable) {
                    return $this->createErrorResponse('RESET_REQUEST_FAILED', Response::HTTP_INTERNAL_SERVER_ERROR);
                }
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

    #[Route('/check-email', name: 'app_check_email', methods: ['GET'])]
    public function checkEmail(): Response
    {
        if ($this->initialAdminManager->needsBootstrap()) {
            return $this->redirectToRoute('setup_admin_page');
        }

        // Display a generic message with TTL to prevent user enumeration
        $ttlMinutes = (int)ceil($this->resetPasswordHelper->getTokenLifetime() / 60);

        return $this->render('reset_password/check_email.html.twig', [
            'tokenLifetime' => $ttlMinutes,
        ]);
    }

    #[Route('/reset/{token}', name: 'app_reset_password', methods: ['GET', 'POST'])]
    public function reset(Request $request, ?string $token = null): Response
    {
        if ($this->initialAdminManager->needsBootstrap()) {
            if ($request->isMethod('GET')) {
                return $this->redirectToRoute('setup_admin_page');
            }

            return new JsonResponse(['error' => 'INITIAL_ADMIN_REQUIRED'], Response::HTTP_CONFLICT);
        }

        if ($token) {
            // Store token in session and avoid keeping it in the URL
            $request->getSession()->set(self::RESET_TOKEN_SESSION_KEY, $token);

            return $this->redirectToRoute('app_reset_password');
        }

        if ($request->isMethod('GET')) {
            if (!$this->featureFlags->isUiEnabled()) {
                throw new NotFoundHttpException();
            }

            $tokenInSession = (string)$request->getSession()->get(self::RESET_TOKEN_SESSION_KEY, '');

        $context = $this->viewPropsBuilder->build($request);
            $props = $context['props'];
            $props['resetToken'] = $tokenInSession;

            return $this->render('reset_password/reset.html.twig', [
                'component_props' => $props,
                'theme_color' => $context['theme_color'],
                'theme_mode' => $context['theme_mode'],
            ]);
        }

        // JSON submission from Vue component
        $data = $this->decodeJson($request);
        $tokenInSession = isset($data['token']) ? (string) $data['token'] : '';
        $plainPassword = isset($data['password']) ? (string) $data['password'] : '';

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

        // Clean token from session if present
        $request->getSession()->remove(self::RESET_TOKEN_SESSION_KEY);

        return new Response('', Response::HTTP_NO_CONTENT);
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeJson(Request $request): array
    {
        $content = $request->getContent();

        if ($content === '') {
            return [];
        }

        $data = json_decode($content, true);

        return is_array($data) ? $data : [];
    }
}
