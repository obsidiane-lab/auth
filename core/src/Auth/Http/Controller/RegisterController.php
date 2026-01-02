<?php

namespace App\Auth\Http\Controller;

use App\Auth\Http\Dto\RegisterUserInput;
use App\Auth\Domain\Exception\RegistrationException;
use App\Auth\Application\RegisterUser;
use App\Shared\Config\FeatureFlags;
use App\Shared\Response\ApiResponseFactory;
use App\Shared\Response\UserPayloadFactory;
use App\Setup\Application\InitialAdminManager;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[AsController]
final class RegisterController extends AbstractController
{
    public function __construct(
        private readonly RegisterUser $registerUser,
        private readonly FeatureFlags $featureFlags,
        private readonly ApiResponseFactory $responses,
        private readonly InitialAdminManager $initialAdminManager,
        private readonly UserPayloadFactory $userPayloadFactory,
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
            $user = $this->registerUser->handle($input);
        } catch (RegistrationException $exception) {
            $isEmailFailure = $exception->getMessage() === 'EMAIL_SEND_FAILED';
            $errorCode = $isEmailFailure ? 'EMAIL_SEND_FAILED' : 'INVALID_REGISTRATION';
            $statusCode = $isEmailFailure ? Response::HTTP_SERVICE_UNAVAILABLE : Response::HTTP_UNPROCESSABLE_ENTITY;
            return $this->responses->error(
                $errorCode,
                $statusCode,
                ['details' => $exception->getErrors()]
            );
        }

        return new JsonResponse([
            'user' => $this->userPayloadFactory->create($user),
        ], Response::HTTP_CREATED);
    }
}
