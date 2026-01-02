<?php

namespace App\Auth\Http\Controller;

use App\Auth\Application\CompleteInvitation;
use App\Auth\Http\Dto\InviteCompleteInput;
use App\Shared\Response\UserPayloadFactory;
use App\Shared\Http\Exception\InvalidInvitationPayloadException;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

#[AsController]
final class AcceptInvitationController extends AbstractController
{
    public function __construct(
        private readonly CompleteInvitation $completeInvitation,
        private readonly UserPayloadFactory $userPayloadFactory,
    ) {
    }

    public function __invoke(InviteCompleteInput $input): JsonResponse
    {
        $token = (string) ($input->token ?? '');
        $password = (string) ($input->password ?? '');
        $confirmPassword = (string) ($input->confirmPassword ?? '');

        if ($token === '') {
            throw new InvalidInvitationPayloadException(['token' => 'INVALID_INVITATION']);
        }

        if ($password === '' || $password !== $confirmPassword) {
            throw new InvalidInvitationPayloadException(['plainPassword' => 'INVALID_PASSWORD']);
        }

        $user = $this->completeInvitation->handle($token, $password);

        return new JsonResponse([
            'user' => $this->userPayloadFactory->create($user),
        ], Response::HTTP_CREATED);
    }
}
