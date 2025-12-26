<?php

namespace App\Controller\Auth;

use App\Auth\Dto\RegisterUserInput;
use App\Auth\Exception\RegistrationException;
use App\Auth\UserRegistration;
use App\Config\FeatureFlags;
use App\Response\ApiResponseFactory;
use App\Setup\InitialAdminManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class RegisterController extends AbstractController
{
    public function __construct(
        private readonly UserRegistration $registration,
        private readonly FeatureFlags $featureFlags,
        private readonly ApiResponseFactory $responses,
        private readonly InitialAdminManager $initialAdminManager,
    ) {
    }

    public function __invoke(RegisterUserInput $input): JsonResponse
    {
        if ($this->initialAdminManager->needsBootstrap()) {
            return $this->responses->error('INITIAL_ADMIN_REQUIRED', Response::HTTP_CONFLICT);
        }

        if (!$this->featureFlags->isRegistrationEnabled()) {
            throw new NotFoundHttpException();
        }

        try {
            $user = $this->registration->register($input);
        } catch (RegistrationException $exception) {
            $errorCode = $exception->getMessage() === 'EMAIL_SEND_FAILED' ? 'EMAIL_SEND_FAILED' : 'INVALID_REGISTRATION';
            return $this->responses->error(
                $errorCode,
                Response::HTTP_UNPROCESSABLE_ENTITY,
                ['details' => $exception->getErrors()]
            );
        }

        return new JsonResponse([
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles(),
                'emailVerified' => $user->isEmailVerified(),
                'lastLoginAt' => $user->getLastLoginAt()?->format(DATE_ATOM),
            ],
        ], Response::HTTP_CREATED);
    }
}
