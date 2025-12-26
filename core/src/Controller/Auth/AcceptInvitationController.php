<?php

namespace App\Controller\Auth;

use App\Auth\Exception\RegistrationException;
use App\Auth\InvitationManager;
use App\Auth\Dto\InviteCompleteInput;
use App\Response\ApiResponseFactory;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class AcceptInvitationController extends AbstractController
{
    public function __construct(
        private readonly InvitationManager $invitationManager,
        private readonly ApiResponseFactory $responses,
    ) {
    }

    public function __invoke(InviteCompleteInput $input): JsonResponse
    {
        $token = (string) ($input->token ?? '');
        $password = (string) ($input->password ?? '');
        $confirmPassword = (string) ($input->confirmPassword ?? '');

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
