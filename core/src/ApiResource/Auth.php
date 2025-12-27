<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Post;
use ApiPlatform\OpenApi\Model\Operation as OpenApiOperation;
use ApiPlatform\OpenApi\Model\Parameter as OpenApiParameter;
use App\Auth\Http\Dto\InviteCompleteInput;
use App\Auth\Http\Dto\InviteUserInput;
use App\Auth\Http\Dto\PasswordForgotInput;
use App\Auth\Http\Dto\PasswordResetInput;
use App\Auth\Http\Dto\RegisterUserInput;
use App\Auth\Http\Controller\AcceptInvitationController;
use App\Auth\Http\Controller\InviteUserController;
use App\Auth\Http\Controller\LogoutController;
use App\Auth\Http\Controller\MeController;
use App\Auth\Http\Controller\RegisterController;
use App\Auth\Http\Controller\ResetPasswordController;
use Symfony\Component\HttpFoundation\Response;

#[ApiResource(
    shortName: 'Auth',
    operations: [
        new Post(
            uriTemplate: '/auth/register',
            status: Response::HTTP_CREATED,
            controller: RegisterController::class,
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
            description: 'Inscrit un nouvel utilisateur (CSRF `register`).',
            denormalizationContext: ['groups' => ['user:register']],
            input: RegisterUserInput::class,
            read: false,
            deserialize: true,
            validate: false,
            write: false,
            name: 'api_auth_register',
        ),
        new Post(
            uriTemplate: '/auth/invite',
            status: Response::HTTP_ACCEPTED,
            controller: InviteUserController::class,
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
            description: 'Invite un utilisateur (admin uniquement, CSRF `invite_user`).',
            denormalizationContext: ['groups' => ['invite:send']],
            input: InviteUserInput::class,
            read: false,
            deserialize: true,
            validate: false,
            write: false,
            name: 'api_auth_invite',
        ),
        new Post(
            uriTemplate: '/auth/invite/complete',
            status: Response::HTTP_CREATED,
            controller: AcceptInvitationController::class,
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
            description: 'Complète une invitation (mot de passe + profil).',
            denormalizationContext: ['groups' => ['invite:complete']],
            input: InviteCompleteInput::class,
            read: false,
            deserialize: true,
            validate: false,
            write: false,
            name: 'api_auth_invite_complete',
        ),
        new Post(
            uriTemplate: '/auth/logout',
            status: Response::HTTP_NO_CONTENT,
            controller: LogoutController::class,
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
            description: 'Déconnecte l’utilisateur (CSRF `logout`).',
            read: false,
            deserialize: false,
            validate: false,
            write: false,
            name: 'api_auth_logout',
        ),
        new Post(
            uriTemplate: '/auth/password/forgot',
            status: Response::HTTP_ACCEPTED,
            controller: ResetPasswordController::class . '::request',
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
            description: 'Demande de réinitialisation du mot de passe.',
            denormalizationContext: ['groups' => ['password:forgot']],
            input: PasswordForgotInput::class,
            read: false,
            deserialize: true,
            validate: false,
            write: false,
            name: 'api_auth_password_forgot',
        ),
        new Post(
            uriTemplate: '/auth/password/reset',
            status: Response::HTTP_NO_CONTENT,
            controller: ResetPasswordController::class . '::reset',
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
            description: 'Réinitialise le mot de passe via token.',
            denormalizationContext: ['groups' => ['password:reset']],
            input: PasswordResetInput::class,
            read: false,
            deserialize: true,
            validate: false,
            write: false,
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
