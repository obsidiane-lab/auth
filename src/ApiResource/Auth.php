<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Post;
use App\Controller\Auth\CsrfTokenController;
use App\Controller\Auth\AcceptInvitationController;
use App\Controller\Auth\InviteUserController;
use App\Controller\Auth\LogoutController;
use App\Controller\Auth\MeController;
use App\Controller\Auth\RegisterController;
use Symfony\Component\HttpFoundation\Response;

#[ApiResource(
    shortName: 'Auth',
    operations: [
        new Post(
            uriTemplate: '/auth/register',
            status: Response::HTTP_CREATED,
            controller: RegisterController::class,
            description: 'Inscrit un nouvel utilisateur (CSRF `register`).',
            read: false,
            deserialize: false,
            validate: false,
            write: false,
            name: 'api_auth_register',
        ),
        new Post(
            uriTemplate: '/auth/invite',
            status: Response::HTTP_ACCEPTED,
            controller: InviteUserController::class,
            description: 'Invite un utilisateur (admin uniquement, CSRF `invite_user`).',
            read: false,
            deserialize: false,
            validate: false,
            write: false,
            name: 'api_auth_invite',
        ),
        new Post(
            uriTemplate: '/auth/invite/complete',
            status: Response::HTTP_CREATED,
            controller: AcceptInvitationController::class,
            description: 'Complète une invitation (mot de passe + profil).',
            read: false,
            deserialize: false,
            validate: false,
            write: false,
            name: 'api_auth_invite_complete',
        ),
        new Post(
            uriTemplate: '/auth/logout',
            status: Response::HTTP_NO_CONTENT,
            controller: LogoutController::class,
            description: 'Déconnecte l’utilisateur (CSRF `logout`).',
            read: false,
            deserialize: false,
            validate: false,
            write: false,
            name: 'api_auth_logout',
        ),
        new Get(
            uriTemplate: '/auth/me',
            controller: MeController::class,
            description: 'Retourne l’utilisateur authentifié.',
            read: false,
            deserialize: false,
            validate: false,
            name: 'api_auth_me',
        ),
        new Get(
            uriTemplate: '/auth/csrf/{tokenId}',
            controller: CsrfTokenController::class,
            description: 'Expose un token CSRF header-only.',
            read: false,
            deserialize: false,
            validate: false,
            name: 'api_auth_csrf_token',
        ),
    ],
    paginationEnabled: false,
)]
final class Auth
{
    #[ApiProperty(identifier: true)]
    public ?string $tokenId = null;
}
