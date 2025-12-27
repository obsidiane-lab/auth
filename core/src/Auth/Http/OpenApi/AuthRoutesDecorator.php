<?php

namespace App\Auth\Http\OpenApi;

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

        $csrfHeader = new Parameter(
            name: 'csrf-token',
            in: 'header',
            required: true,
            schema: ['type' => 'string']
        );

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
                '403' => new Response(description: 'CSRF invalide.'),
            ],
            summary: 'Authentifie un utilisateur et pose les cookies.',
            parameters: [$csrfHeader],
            requestBody: new RequestBody(
                description: 'Identifiants utilisateur',
                content: new ArrayObject([
                    'application/json' => new MediaType(schema: $loginRequestSchema),
                ]),
                required: true
            ),
            security: []
        );

        $forgotPasswordRequestSchema = new Schema();
        $forgotPasswordRequestSchema['type'] = 'object';
        $forgotPasswordRequestSchema['properties'] = new ArrayObject([
            'email' => ['type' => 'string', 'format' => 'email'],
        ]);
        $forgotPasswordRequestSchema['required'] = ['email'];

        $forgotPasswordOperation = new Operation(
            operationId: 'post_api_auth_password_forgot',
            tags: ['Mot de passe'],
            responses: [
                '202' => new Response(description: 'Demande acceptée.'),
                '403' => new Response(description: 'CSRF invalide.'),
            ],
            summary: 'Déclenche un email de réinitialisation.',
            parameters: [$csrfHeader],
            requestBody: new RequestBody(
                description: 'Demande de réinitialisation',
                content: new ArrayObject([
                    'application/json' => new MediaType(schema: $forgotPasswordRequestSchema),
                ]),
                required: true
            ),
            security: []
        );

        $resetPasswordRequestSchema = new Schema();
        $resetPasswordRequestSchema['type'] = 'object';
        $resetPasswordRequestSchema['properties'] = new ArrayObject([
            'token' => ['type' => 'string'],
            'password' => ['type' => 'string'],
        ]);
        $resetPasswordRequestSchema['required'] = ['token', 'password'];

        $resetPasswordOperation = new Operation(
            operationId: 'post_api_auth_password_reset',
            tags: ['Mot de passe'],
            responses: [
                '204' => new Response(description: 'Mot de passe mis à jour.'),
                '400' => new Response(description: 'Token ou mot de passe invalide.'),
                '403' => new Response(description: 'CSRF invalide.'),
            ],
            summary: 'Réinitialise le mot de passe via token.',
            parameters: [$csrfHeader],
            requestBody: new RequestBody(
                description: 'Réinitialisation de mot de passe',
                content: new ArrayObject([
                    'application/json' => new MediaType(schema: $resetPasswordRequestSchema),
                ]),
                required: true
            ),
            security: []
        );

        $verifyParameters = [
            new Parameter(name: 'id', in: 'query', required: true, schema: ['type' => 'integer']),
            new Parameter(name: 'token', in: 'query', required: true, schema: ['type' => 'string']),
            new Parameter(name: 'expires', in: 'query', required: true, schema: ['type' => 'integer', 'format' => 'int64']),
            new Parameter(name: '_hash', in: 'query', required: true, schema: ['type' => 'string']),
        ];

        $verifyEmailOperation = new Operation(
            operationId: 'get_api_auth_verify_email',
            tags: ['Authentification'],
            responses: [
                '200' => new Response(description: 'Email vérifié.'),
                '400' => new Response(description: 'Lien invalide ou expiré.'),
                '404' => new Response(description: 'Utilisateur introuvable.'),
            ],
            summary: 'Valide le lien d’email.',
            parameters: $verifyParameters,
            security: []
        );

        $setupAdminRequestSchema = new Schema();
        $setupAdminRequestSchema['type'] = 'object';
        $setupAdminRequestSchema['properties'] = new ArrayObject([
            'email' => ['type' => 'string', 'format' => 'email'],
            'password' => ['type' => 'string'],
        ]);
        $setupAdminRequestSchema['required'] = ['email', 'password'];

        $setupAdminResponseSchema = new Schema();
        $setupAdminResponseSchema['type'] = 'object';
        $setupAdminResponseSchema['properties'] = new ArrayObject([
            'user' => $userSchema,
        ]);

        $setupAdminOperation = new Operation(
            operationId: 'post_api_setup_admin',
            tags: ['Setup'],
            responses: [
                '201' => new Response(
                    description: 'Administrateur créé.',
                    content: new ArrayObject([
                        'application/json' => new MediaType(schema: $setupAdminResponseSchema),
                    ])
                ),
                '409' => new Response(description: 'Administrateur déjà créé.'),
            ],
            summary: 'Crée le premier administrateur.',
            parameters: [$csrfHeader],
            requestBody: new RequestBody(
                description: 'Création administrateur initial',
                content: new ArrayObject([
                    'application/json' => new MediaType(schema: $setupAdminRequestSchema),
                ]),
                required: true
            ),
            security: []
        );

        $paths->addPath('/api/auth/login', new PathItem(post: $loginOperation));
        $paths->addPath('/api/auth/refresh', new PathItem(post: $refreshOperation));
        $paths->addPath('/api/auth/password/forgot', new PathItem(post: $forgotPasswordOperation));
        $paths->addPath('/api/auth/password/reset', new PathItem(post: $resetPasswordOperation));
        $paths->addPath('/api/auth/verify-email', new PathItem(get: $verifyEmailOperation));
        $paths->addPath('/api/setup/admin', new PathItem(post: $setupAdminOperation));

        return $openApi;
    }
}
