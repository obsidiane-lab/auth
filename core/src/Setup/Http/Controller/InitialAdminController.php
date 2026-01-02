<?php

namespace App\Setup\Http\Controller;

use App\Auth\Http\Dto\RegisterUserInput;
use App\Shared\Response\UserPayloadFactory;
use App\Setup\Application\InitialAdminManager;
use App\Shared\Http\Exception\InitialAdminAlreadyCreatedException;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

#[AsController]
final class InitialAdminController extends AbstractController
{
    public function __construct(
        private readonly InitialAdminManager $initialAdminManager,
        private readonly UserPayloadFactory $userPayloadFactory,
    ) {
    }

    public function __invoke(RegisterUserInput $input): JsonResponse
    {
        if (!$this->initialAdminManager->needsBootstrap()) {
            throw new InitialAdminAlreadyCreatedException();
        }

        $user = $this->initialAdminManager->createInitialAdmin($input);

        return new JsonResponse([
            'user' => $this->userPayloadFactory->create($user),
        ], Response::HTTP_CREATED);
    }
}
