<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Post;
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
            openapiContext: [
                'parameters' => [
                    [
                        'name' => 'csrf-token',
                        'in' => 'header',
                        'required' => true,
                        'schema' => ['type' => 'string'],
                    ],
                ],
            ],
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
