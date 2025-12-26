<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Post;
use ApiPlatform\OpenApi\Model\Operation as OpenApiOperation;
use ApiPlatform\OpenApi\Model\Parameter as OpenApiParameter;
use App\Auth\Dto\InviteCompleteInput;
use App\Auth\Dto\InviteUserInput;
use App\Auth\Dto\PasswordForgotInput;
use App\Auth\Dto\PasswordResetInput;
use App\Auth\Dto\RegisterUserInput;
use App\Controller\Auth\AcceptInvitationController;
use App\Controller\Auth\InviteUserController;
use App\Controller\Auth\LogoutController;
use App\Controller\Auth\MeController;
use App\Controller\Auth\RegisterController;
use App\Controller\ResetPasswordController;
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
            deserialize: true,
            validate: false,
            input: RegisterUserInput::class,
            denormalizationContext: ['groups' => ['user:register']],
            write: false,
            openapi: new OpenApiOperation(
                parameters: [
                    new OpenApiParameter(
                        name: 'csrf-token',
                        in: 'header',
                        description: 'Jeton CSRF stateless',
                        required: true,
                        schema: ['type' => 'string']
                    ),
                ]
            ),
            name: 'api_auth_register',
        ),
        new Post(
            uriTemplate: '/auth/invite',
            status: Response::HTTP_ACCEPTED,
            controller: InviteUserController::class,
            description: 'Invite un utilisateur (admin uniquement, CSRF `invite_user`).',
            read: false,
            deserialize: true,
            validate: false,
            input: InviteUserInput::class,
            denormalizationContext: ['groups' => ['invite:send']],
            write: false,
            openapi: new OpenApiOperation(
                parameters: [
                    new OpenApiParameter(
                        name: 'csrf-token',
                        in: 'header',
                        description: 'Jeton CSRF stateless',
                        required: true,
                        schema: ['type' => 'string']
                    ),
                ]
            ),
            name: 'api_auth_invite',
        ),
        new Post(
            uriTemplate: '/auth/invite/complete',
            status: Response::HTTP_CREATED,
            controller: AcceptInvitationController::class,
            description: 'Complète une invitation (mot de passe + profil).',
            read: false,
            deserialize: true,
            validate: false,
            input: InviteCompleteInput::class,
            denormalizationContext: ['groups' => ['invite:complete']],
            write: false,
            openapi: new OpenApiOperation(
                parameters: [
                    new OpenApiParameter(
                        name: 'csrf-token',
                        in: 'header',
                        description: 'Jeton CSRF stateless',
                        required: true,
                        schema: ['type' => 'string']
                    ),
                ]
            ),
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
            openapi: new OpenApiOperation(
                parameters: [
                    new OpenApiParameter(
                        name: 'csrf-token',
                        in: 'header',
                        description: 'Jeton CSRF stateless',
                        required: true,
                        schema: ['type' => 'string']
                    ),
                ]
            ),
            name: 'api_auth_logout',
        ),
        new Post(
            uriTemplate: '/auth/password/forgot',
            status: Response::HTTP_ACCEPTED,
            controller: ResetPasswordController::class . '::request',
            description: 'Demande de réinitialisation du mot de passe.',
            read: false,
            deserialize: true,
            validate: false,
            input: PasswordForgotInput::class,
            denormalizationContext: ['groups' => ['password:forgot']],
            write: false,
            openapi: new OpenApiOperation(
                parameters: [
                    new OpenApiParameter(
                        name: 'csrf-token',
                        in: 'header',
                        description: 'Jeton CSRF stateless',
                        required: true,
                        schema: ['type' => 'string']
                    ),
                ]
            ),
            name: 'api_auth_password_forgot',
        ),
        new Post(
            uriTemplate: '/auth/password/reset',
            status: Response::HTTP_NO_CONTENT,
            controller: ResetPasswordController::class . '::reset',
            description: 'Réinitialise le mot de passe via token.',
            read: false,
            deserialize: true,
            validate: false,
            input: PasswordResetInput::class,
            denormalizationContext: ['groups' => ['password:reset']],
            write: false,
            openapi: new OpenApiOperation(
                parameters: [
                    new OpenApiParameter(
                        name: 'csrf-token',
                        in: 'header',
                        description: 'Jeton CSRF stateless',
                        required: true,
                        schema: ['type' => 'string']
                    ),
                ]
            ),
            name: 'api_auth_password_reset',
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
    ],
    paginationEnabled: false,
)]
final class Auth
{
    #[ApiProperty(identifier: true)]
    public ?string $tokenId = null;
}
