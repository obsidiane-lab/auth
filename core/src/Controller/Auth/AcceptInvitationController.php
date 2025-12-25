<?php

namespace App\Controller\Auth;

use App\Auth\Exception\RegistrationException;
use App\Auth\InvitationManager;
use App\Http\JsonRequestDecoderTrait;
use App\Response\ApiResponseFactory;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\Exception\NotEncodableValueException;

final class AcceptInvitationController extends AbstractController
{
    use JsonRequestDecoderTrait;

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
        $password = isset($payload['password']) ? (string) $payload['password'] : '';
        $confirmPassword = isset($payload['confirmPassword']) ? (string) $payload['confirmPassword'] : '';

        if ($token === '' || $password === '' || $password !== $confirmPassword) {
            return $this->responses->error('INVALID_INVITATION_PAYLOAD', Response::HTTP_BAD_REQUEST);
        }

        try {
            $user = $this->invitationManager->complete($token, $password);
        } catch (RegistrationException $exception) {
            $errors = $exception->getErrors();
            $errorCode = $exception->getMessage();
            return $this->responses->error(
                $errorCode,
                Response::HTTP_UNPROCESSABLE_ENTITY,
                ['details' => $errors]
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
