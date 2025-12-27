<?php

namespace App\Setup\Http\Controller;

use App\Auth\Http\Dto\RegisterUserInput;
use App\Auth\Domain\Exception\RegistrationException;
use App\Shared\Response\ApiResponseFactory;
use App\Shared\Response\UserPayloadFactory;
use App\Setup\Application\InitialAdminManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class InitialAdminController extends AbstractController
{
    public function __construct(
        private readonly InitialAdminManager $initialAdminManager,
        private readonly ApiResponseFactory $responses,
        private readonly UserPayloadFactory $userPayloadFactory,
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
            'user' => $this->userPayloadFactory->create($user),
        ], Response::HTTP_CREATED);
    }
}
