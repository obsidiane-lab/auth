<?php

namespace App\Controller\Setup;

use App\Auth\Dto\RegisterUserInput;
use App\Auth\Exception\RegistrationException;
use App\Response\ApiResponseFactory;
use App\Setup\InitialAdminManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class InitialAdminController extends AbstractController
{
    public function __construct(
        private readonly InitialAdminManager $initialAdminManager,
        private readonly ApiResponseFactory $responses,
    ) {
    }

    public function __invoke(RegisterUserInput $input): JsonResponse
    {
        if (!$this->initialAdminManager->needsBootstrap()) {
            return $this->responses->error('INITIAL_ADMIN_ALREADY_CREATED', Response::HTTP_CONFLICT);
        }

        try {
            $user = $this->initialAdminManager->createInitialAdmin($input);
        } catch (RegistrationException $exception) {
            return $this->responses->error(
                'INVALID_REGISTRATION',
                Response::HTTP_UNPROCESSABLE_ENTITY,
                ['details' => $exception->getErrors()]
            );
        } catch (\LogicException) {
            return $this->responses->error('INITIAL_ADMIN_ALREADY_CREATED', Response::HTTP_CONFLICT);
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
