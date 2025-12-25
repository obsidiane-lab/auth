<?php

namespace App\Controller\Setup;

use App\Auth\Exception\RegistrationException;
use App\Response\ApiResponseFactory;
use App\Setup\InitialAdminManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/setup/admin', name: 'api_setup_initial_admin', methods: ['POST'])]
final class InitialAdminController extends AbstractController
{
    public function __construct(
        private readonly InitialAdminManager $initialAdminManager,
        private readonly ApiResponseFactory $responses,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        if (!$this->initialAdminManager->needsBootstrap()) {
            return $this->responses->error('INITIAL_ADMIN_ALREADY_CREATED', Response::HTTP_CONFLICT);
        }

        $payload = $this->decodeJson($request);
        if ($payload === null) {
            return $this->responses->error('INVALID_PAYLOAD', Response::HTTP_BAD_REQUEST);
        }

        $input = $this->initialAdminManager->createInputFromPayload($payload);

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

    /**
     * @return array<string, mixed>|null
     */
    private function decodeJson(Request $request): ?array
    {
        $content = $request->getContent();
        if ($content === '') {
            return null;
        }

        try {
            $data = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            return null;
        }

        return is_array($data) ? $data : null;
    }
}
