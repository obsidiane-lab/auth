<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use App\Auth\Http\Controller\InvitePreviewController;
use Symfony\Component\HttpFoundation\Response;

#[ApiResource(
    shortName: 'InvitePreview',
    operations: [
        new Get(
            uriTemplate: '/auth/invite/preview',
            controller: InvitePreviewController::class,
            status: Response::HTTP_OK,
            read: false,
            deserialize: false,
            name: 'api_auth_invite_preview',
        ),
    ],
    paginationEnabled: false,
)]
final class InvitePreview
{
    #[ApiProperty(identifier: true)]
    public ?string $token = null;

    public ?string $email = null;

    public bool $accepted = false;

    public bool $expired = false;
}
