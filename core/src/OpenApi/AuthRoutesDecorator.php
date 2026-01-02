<?php

namespace App\OpenApi;

use ApiPlatform\OpenApi\Factory\OpenApiFactoryInterface;
use ApiPlatform\OpenApi\Model\MediaType;
use ApiPlatform\OpenApi\Model\Operation;
use ApiPlatform\OpenApi\Model\Parameter;
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

        $loginRequestSchema = new Schema();
        $loginRequestSchema['type'] = 'object';
        $loginRequestSchema['properties'] = new ArrayObject([
            'email' => ['type' => 'string', 'format' => 'email'],
            'password' => ['type' => 'string'],
        ]);
        $loginRequestSchema['required'] = ['email', 'password'];

        $userSchema = new Schema();
        $userSchema['type'] = 'object';
        $userSchema['properties'] = new ArrayObject([
            'id' => ['type' => 'integer'],
            'email' => ['type' => 'string', 'format' => 'email'],
            'roles' => ['type' => 'array', 'items' => ['type' => 'string']],
            'emailVerified' => ['type' => 'boolean'],
            'lastLoginAt' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
        ]);

        $loginResponseSchema = new Schema();
        $loginResponseSchema['type'] = 'object';
        $loginResponseSchema['properties'] = new ArrayObject([
            'user' => $userSchema,
            'exp' => ['type' => 'integer', 'format' => 'int64'],
        ]);

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

        $loginOperation = new Operation(
            operationId: 'post_api_auth_login',
            tags: ['Authentification'],
            responses: [
                '200' => new Response(
                    description: 'Connexion réussie (cookies mis à jour).',
                    content: new ArrayObject([
                        'application/json' => new MediaType(schema: $loginResponseSchema),
                    ])
                ),
                '401' => new Response(description: 'Identifiants invalides.'),
                '423' => new Response(description: 'Email non vérifié.'),
                '429' => new Response(description: 'Trop de tentatives. Réessayez plus tard.'),
            ],
            summary: 'Authentifie un utilisateur et pose les cookies.',
            requestBody: new RequestBody(
                description: 'Identifiants utilisateur',
                content: new ArrayObject([
                    'application/json' => new MediaType(schema: $loginRequestSchema),
                ]),
                required: true
            ),
            security: []
        );

        $verifyParameters = [
            new Parameter(name: 'id', in: 'query', required: true, schema: ['type' => 'integer']),
            new Parameter(name: 'token', in: 'query', required: true, schema: ['type' => 'string']),
            new Parameter(name: 'expires', in: 'query', required: true, schema: ['type' => 'integer', 'format' => 'int64']),
            new Parameter(name: 'signature', in: 'query', required: true, schema: ['type' => 'string']),
        ];

        $verifyEmailOperation = new Operation(
            operationId: 'get_api_auth_verify_email',
            tags: ['Authentification'],
            responses: [
                '200' => new Response(description: 'Email vérifié.'),
                '400' => new Response(description: 'Lien invalide ou expiré.'),
                '404' => new Response(description: 'Utilisateur introuvable.'),
                '410' => new Response(description: 'Lien expiré.'),
            ],
            summary: 'Valide le lien d’email.',
            parameters: $verifyParameters,
            security: []
        );

        $paths->addPath('/api/auth/login', new PathItem(post: $loginOperation));
        $paths->addPath('/api/auth/refresh', new PathItem(post: $refreshOperation));
        $paths->addPath('/api/auth/verify-email', new PathItem(get: $verifyEmailOperation));

        return $openApi;
    }
}
