<?php

namespace App\OpenApi;

use ApiPlatform\OpenApi\Factory\OpenApiFactoryInterface;
use ApiPlatform\OpenApi\Model\MediaType;
use ApiPlatform\OpenApi\Model\Operation;
use ApiPlatform\OpenApi\Model\PathItem;
use ApiPlatform\OpenApi\Model\RequestBody;
use ApiPlatform\OpenApi\Model\Response;
use ApiPlatform\OpenApi\Model\Schema;
use ApiPlatform\OpenApi\OpenApi;
use ArrayObject;

final class AuthRoutesDecorator implements OpenApiFactoryInterface
{
    public function __construct(private readonly OpenApiFactoryInterface $inner)
    {
    }

    public function __invoke(array $context = []): OpenApi
    {
        $openApi = ($this->inner)($context);
        $paths = $openApi->getPaths();

        $refreshResponseSchema = new Schema();
        $refreshResponseSchema['type'] = 'object';
        $refreshResponseSchema['properties'] = new ArrayObject([
            'exp' => ['type' => 'integer', 'format' => 'int64'],
        ]);

        $refreshOperation = new Operation(
            operationId: 'post_app_token_refresh',
            tags: ['Authentification'],
            responses: [
                '200' => new Response(
                    description: 'Jeton renouvelé (cookies mis à jour).',
                    content: new ArrayObject([
                        'application/json' => new MediaType(schema: $refreshResponseSchema),
                    ])
                ),
                '401' => new Response(description: 'Refresh token manquant ou invalide.'),
            ],
            summary: 'Rafraîchit le token d’accès via Gesdinet (cookie HttpOnly).',
            security: []
        );

        $paths->addPath('/api/token/refresh', new PathItem(post: $refreshOperation));

        return $openApi;
    }
}
