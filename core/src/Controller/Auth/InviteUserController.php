<?php

namespace App\Controller\Auth;

use App\Auth\InviteUser;
use App\Dto\Auth\InviteUserInput;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[AsController]
#[IsGranted('ROLE_ADMIN')]
final class InviteUserController extends AbstractController
{
    public function __construct(
        private readonly InviteUser $inviteUser,
    ) {
    }

    public function __invoke(InviteUserInput $input): JsonResponse
    {
        $this->inviteUser->handle($input);

        return new JsonResponse(['status' => 'INVITE_SENT'], Response::HTTP_ACCEPTED);
    }
}
