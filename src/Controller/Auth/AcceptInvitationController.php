<?php

namespace App\Controller\Auth;

use App\Auth\Exception\RegistrationException;
use App\Auth\InvitationManager;
use App\Response\ApiResponseFactory;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\Exception\NotEncodableValueException;

final class AcceptInvitationController extends AbstractController
{
    public function __construct(
        private readonly InvitationManager $invitationManager,
        private readonly ApiResponseFactory $responses,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        try {
            $payload = $this->decodeJson($request);
        } catch (NotEncodableValueException) {
            return $this->responses->error('INVALID_PAYLOAD', Response::HTTP_BAD_REQUEST);
        }

        $token = isset($payload['token']) ? (string) $payload['token'] : '';
        $displayName = isset($payload['displayName']) ? (string) $payload['displayName'] : '';
        $password = isset($payload['password']) ? (string) $payload['password'] : '';
        $confirmPassword = isset($payload['confirmPassword']) ? (string) $payload['confirmPassword'] : '';

        if ($token === '' || $password === '' || $password !== $confirmPassword) {
            return $this->responses->error('INVALID_INVITATION_PAYLOAD', Response::HTTP_BAD_REQUEST);
        }

        try {
            $user = $this->invitationManager->complete($token, $displayName, $password);
        } catch (RegistrationException $exception) {
            $errors = $exception->getErrors();
            $errorCode = $exception->getMessage();

            return new JsonResponse(
                [
                    'error' => $errorCode,
                    'details' => $errors,
                ],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        return new JsonResponse([
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'displayName' => $user->getDisplayName(),
                'roles' => $user->getRoles(),
            ],
        ], Response::HTTP_CREATED);
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

        if (!is_array($data)) {
            throw new NotEncodableValueException('Invalid JSON payload.');
        }

        return $data;
    }
}

