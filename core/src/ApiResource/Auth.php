<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Post;
use App\Dto\Auth\InviteCompleteInput;
use App\Dto\Auth\InviteUserInput;
use App\Dto\Auth\PasswordForgotInput;
use App\Dto\Auth\PasswordResetInput;
use App\Dto\Auth\RegisterUserInput;
use App\Controller\Auth\AcceptInvitationController;
use App\Controller\Auth\InviteUserController;
use App\Controller\Auth\LogoutController;
use App\Controller\Auth\MeController;
use App\Controller\Auth\RegisterController;
use App\Controller\Auth\ResetPasswordController;
use Symfony\Component\HttpFoundation\Response;

#[ApiResource(
    shortName: 'Auth',
    operations: [
        new Post(
            uriTemplate: '/auth/register',
            status: Response::HTTP_CREATED,
            controller: RegisterController::class,
            description: 'Inscrit un nouvel utilisateur.',
            denormalizationContext: ['groups' => ['user:register']],
            input: RegisterUserInput::class,
            read: false,
            write: false,
            name: 'api_auth_register',
        ),
        new Post(
            uriTemplate: '/auth/invite',
            status: Response::HTTP_ACCEPTED,
            controller: InviteUserController::class,
            description: 'Invite un utilisateur (admin uniquement).',
            denormalizationContext: ['groups' => ['invite:send']],
            input: InviteUserInput::class,
            read: false,
            write: false,
            name: 'api_auth_invite',
        ),
        new Post(
            uriTemplate: '/auth/invite/complete',
            status: Response::HTTP_CREATED,
            controller: AcceptInvitationController::class,
            description: 'Complète une invitation (mot de passe + profil).',
            denormalizationContext: ['groups' => ['invite:complete']],
            input: InviteCompleteInput::class,
            read: false,
            write: false,
            name: 'api_auth_invite_complete',
        ),
        new Post(
            uriTemplate: '/auth/logout',
            status: Response::HTTP_NO_CONTENT,
            controller: LogoutController::class,
            description: 'Déconnecte l’utilisateur.',
            read: false,
            deserialize: false,
            write: false,
            name: 'api_auth_logout',
        ),
        new Post(
            uriTemplate: '/auth/password/forgot',
            status: Response::HTTP_ACCEPTED,
            controller: ResetPasswordController::class . '::request',
            description: 'Demande de réinitialisation du mot de passe.',
            denormalizationContext: ['groups' => ['password:forgot']],
            input: PasswordForgotInput::class,
            read: false,
            write: false,
            name: 'api_auth_password_forgot',
        ),
        new Post(
            uriTemplate: '/auth/password/reset',
            status: Response::HTTP_NO_CONTENT,
            controller: ResetPasswordController::class . '::reset',
            description: 'Réinitialise le mot de passe via token.',
            denormalizationContext: ['groups' => ['password:reset']],
            input: PasswordResetInput::class,
            read: false,
            write: false,
            name: 'api_auth_password_reset',
        ),
        new Get(
            uriTemplate: '/auth/me',
            controller: MeController::class,
            description: 'Retourne l’utilisateur authentifié.',
            read: false,
            deserialize: false,
            name: 'api_auth_me',
        ),
    ],
    paginationEnabled: false,
)]
final class Auth
{
    #[ApiProperty(identifier: true)]
    public ?string $tokenId = null;
}
