<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use App\Controller\FrontendConfigController;
use Symfony\Component\HttpFoundation\Response;

#[ApiResource(
    shortName: 'FrontendConfig',
    operations: [
        new Get(
            uriTemplate: '/config',
            status: Response::HTTP_OK,
            controller: FrontendConfigController::class,
            read: false,
            deserialize: false,
            name: 'api_frontend_config',
        ),
    ],
    paginationEnabled: false,
)]
final class FrontendConfig
{
    #[ApiProperty(identifier: true)]
    public ?string $id = null;

    public bool $registrationEnabled = false;

    public int $passwordStrengthLevel = 0;

    public string $brandingName = '';

    public string $frontendRedirectUrl = '';

    public string $environment = '';

    public string $themeMode = 'dark';

    public string $themeColor = 'base';

}
