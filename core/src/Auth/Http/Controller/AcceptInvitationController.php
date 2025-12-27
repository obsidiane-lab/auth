<?php

namespace App\Auth\Http\Controller;

use App\Auth\Domain\Exception\RegistrationException;
use App\Auth\Application\CompleteInvitation;
use App\Auth\Http\Dto\InviteCompleteInput;
use App\Shared\Response\ApiResponseFactory;
use App\Shared\Response\UserPayloadFactory;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class AcceptInvitationController extends AbstractController
{
    public function __construct(
        private readonly CompleteInvitation $completeInvitation,
        private readonly ApiResponseFactory $responses,
        private readonly UserPayloadFactory $userPayloadFactory,
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
            $user = $this->completeInvitation->handle($token, $password);
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
            'user' => $this->userPayloadFactory->create($user),
        ], Response::HTTP_CREATED);
    }
}
