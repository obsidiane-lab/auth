<?php

namespace App\Controller\Auth;

use App\ApiResource\InvitePreview;
use App\Repository\InviteUserRepository;
use App\Exception\Auth\InvalidInvitationPayloadException;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[AsController]
final readonly class InvitePreviewController
{
    public function __construct(
        private InviteUserRepository $inviteUserRepository,
    ) {
    }

    public function __invoke(Request $request): InvitePreview
    {
        $token = (string) $request->query->get('token', '');

        if ($token === '') {
            throw new InvalidInvitationPayloadException(['token' => 'INVALID_INVITATION']);
        }

        $invite = $this->inviteUserRepository->findOneBy(['token' => $token]);

        if ($invite === null) {
            throw new NotFoundHttpException('Invalid invitation.');
        }

        $preview = new InvitePreview();
        $preview->token = $token;
        $preview->email = $invite->getEmail();
        $preview->accepted = $invite->isAccepted();
        $preview->expired = $invite->isExpired();

        return $preview;
    }
}
