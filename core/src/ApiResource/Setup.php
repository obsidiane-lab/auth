<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Post;
use ApiPlatform\OpenApi\Model\Operation as OpenApiOperation;
use ApiPlatform\OpenApi\Model\Parameter as OpenApiParameter;
use App\Auth\Dto\RegisterUserInput;
use App\Controller\Setup\InitialAdminController;
use Symfony\Component\HttpFoundation\Response;

#[ApiResource(
    shortName: 'Setup',
    operations: [
        new Post(
            uriTemplate: '/setup/admin',
            status: Response::HTTP_CREATED,
            controller: InitialAdminController::class,
            description: 'Crée le premier administrateur (CSRF `initial_admin`).',
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
            name: 'api_setup_initial_admin',
        ),
    ],
    paginationEnabled: false,
)]
final class Setup
{
    #[ApiProperty(identifier: true)]
    public ?string $tokenId = null;
}
