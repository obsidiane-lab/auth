<?php

namespace App\Shared\EventSubscriber;

use App\Shared\Response\ApiResponseFactory;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

final class CsrfProtectedRoutesSubscriber implements EventSubscriberInterface
{
    private const HEADER_NAME = 'csrf-token';
    private const FALLBACK_TOKEN_ID = 'api_write';

    /**
     * @var array<string, string>
     */
    private const TOKEN_IDS_BY_ROUTE = [
        'api_login' => 'authenticate',
        'api_auth_logout' => 'logout',
        'api_auth_register' => 'register',
        'api_auth_invite' => 'invite_user',
        'api_auth_invite_complete' => 'invite_complete',
        'api_auth_password_forgot' => 'password_forgot',
        'api_auth_password_reset' => 'password_reset',
        'api_setup_initial_admin' => 'initial_admin',
        'api_users_update_roles' => 'user_roles',
    ];

    /**
     * @var array<string, array{payload: array<mixed>, status: int}>
     */
    private const SOFT_PATHS = [
        '/api/auth/password/forgot' => [
            'payload' => ['status' => 'OK'],
            'status' => Response::HTTP_ACCEPTED,
        ],
    ];

    /**
     * @var list<string>
     */
    private const EXCLUDED_PATHS = [
        '/api/auth/refresh',
    ];

    public function __construct(
        private CsrfTokenManagerInterface $csrfTokenManager,
        private ApiResponseFactory $responses,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 15],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();

        if ($request->isMethodSafe()) {
            return;
        }

        $path = rtrim($request->getPathInfo(), '/');
        $path = $path === '' ? '/' : $path;

        if (!str_starts_with($path, '/api')) {
            return;
        }

        if (in_array($path, self::EXCLUDED_PATHS, true)) {
            return;
        }

        $tokenId = $this->resolveTokenId($request->attributes->get('_route'), $path);
        $tokenValue = $request->headers->get(self::HEADER_NAME);

        if (is_string($tokenValue) && $tokenValue !== '') {
            $csrfToken = new CsrfToken($tokenId, $tokenValue);
            if ($this->csrfTokenManager->isTokenValid($csrfToken)) {
                return;
            }
        }

        if (isset(self::SOFT_PATHS[$path])) {
            $config = self::SOFT_PATHS[$path];
            $event->setResponse(new JsonResponse($config['payload'], $config['status']));

            return;
        }

        $event->setResponse($this->responses->error('CSRF_TOKEN_INVALID', Response::HTTP_FORBIDDEN));
    }

    private function resolveTokenId(mixed $routeName, string $path): string
    {
        if (is_string($routeName) && isset(self::TOKEN_IDS_BY_ROUTE[$routeName])) {
            return self::TOKEN_IDS_BY_ROUTE[$routeName];
        }

        if ($this->isUserRolesPath($path)) {
            return self::TOKEN_IDS_BY_ROUTE['api_users_update_roles'];
        }

        return self::FALLBACK_TOKEN_ID;
    }

    private function isUserRolesPath(string $path): bool
    {
        if (!str_starts_with($path, '/api/users/')) {
            return false;
        }

        return str_ends_with($path, '/roles');
    }
}
