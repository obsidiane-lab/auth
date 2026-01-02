<?php

namespace App\Auth\Http\Controller;

use App\Auth\Http\Dto\RegisterUserInput;
use App\Auth\Application\RegisterUser;
use App\Shared\Config\FeatureFlags;
use App\Shared\Response\UserPayloadFactory;
use App\Setup\Application\InitialAdminManager;
use App\Shared\Http\Exception\InitialAdminRequiredException;
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
        private readonly InitialAdminManager $initialAdminManager,
        private readonly UserPayloadFactory $userPayloadFactory,
    ) {
    }

    public function __invoke(RegisterUserInput $input): JsonResponse
    {
        if ($this->initialAdminManager->needsBootstrap()) {
            throw new InitialAdminRequiredException();
        }

        if (!$this->featureFlags->isRegistrationEnabled()) {
            throw new NotFoundHttpException();
        }

        $user = $this->registerUser->handle($input);

        return new JsonResponse([
            'user' => $this->userPayloadFactory->create($user),
        ], Response::HTTP_CREATED);
    }
}
