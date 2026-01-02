<?php

namespace App\Auth\Http\Controller;

use App\Auth\Application\InviteUser;
use App\Auth\Http\Dto\InviteUserInput;
use App\Shared\Http\Exception\InitialAdminRequiredException;
use App\Setup\Application\InitialAdminManager;
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
        private readonly InitialAdminManager $initialAdminManager,
    ) {
    }

    public function __invoke(InviteUserInput $input): JsonResponse
    {
        if ($this->initialAdminManager->needsBootstrap()) {
            throw new InitialAdminRequiredException();
        }

        $this->inviteUser->handle($input);

        return new JsonResponse(['status' => 'INVITE_SENT'], Response::HTTP_ACCEPTED);
    }
}
