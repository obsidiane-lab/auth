<?php

namespace App\Auth\Http\Controller;

use App\ApiResource\InvitePreview;
use App\Repository\InviteUserRepository;
use App\Shared\Response\ApiResponseFactory;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

#[AsController]
final readonly class InvitePreviewController
{
    public function __construct(
        private InviteUserRepository $inviteUserRepository,
        private ApiResponseFactory $responses,
    ) {
    }

    public function __invoke(Request $request): InvitePreview|Response
    {
        $token = (string) $request->query->get('token', '');

        if ($token === '') {
            return $this->responses->error('INVALID_INVITATION', Response::HTTP_BAD_REQUEST);
        }

        $invite = $this->inviteUserRepository->findOneBy(['token' => $token]);

        if ($invite === null) {
            return $this->responses->error('INVALID_INVITATION', Response::HTTP_NOT_FOUND);
        }

        $preview = new InvitePreview();
        $preview->token = $token;
        $preview->email = $invite->getEmail();
        $preview->accepted = $invite->isAccepted();
        $preview->expired = $invite->isExpired();

        return $preview;
    }
}
