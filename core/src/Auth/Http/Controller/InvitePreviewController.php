<?php

namespace App\Auth\Http\Controller;

use App\ApiResource\InvitePreview;
use App\Repository\InviteUserRepository;
use App\Shared\Http\Exception\InvalidInvitationException;
use App\Shared\Http\Exception\InvalidInvitationPayloadException;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpFoundation\Request;

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
            throw new InvalidInvitationException();
        }

        $preview = new InvitePreview();
        $preview->token = $token;
        $preview->email = $invite->getEmail();
        $preview->accepted = $invite->isAccepted();
        $preview->expired = $invite->isExpired();

        return $preview;
    }
}
