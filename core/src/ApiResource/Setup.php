<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Post;
use App\Auth\Http\Dto\RegisterUserInput;
use App\Setup\Http\Controller\InitialAdminController;
use Symfony\Component\HttpFoundation\Response;

#[ApiResource(
    shortName: 'Setup',
    operations: [
        new Post(
            uriTemplate: '/setup/admin',
            status: Response::HTTP_CREATED,
            controller: InitialAdminController::class,
            description: 'Crée le premier administrateur.',
            denormalizationContext: ['groups' => ['user:register']],
            input: RegisterUserInput::class,
            read: false,
            deserialize: true,
            validate: false,
            write: false,
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
