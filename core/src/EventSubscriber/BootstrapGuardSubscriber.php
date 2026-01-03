<?php

namespace App\EventSubscriber;

use App\Exception\Setup\InitialAdminRequiredException;
use App\Setup\InitialAdminManager;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

final readonly class BootstrapGuardSubscriber implements EventSubscriberInterface
{
    /**
     * @var list<string>
     */
    private const array ALLOWED_ROUTES = [
        'api_setup_initial_admin',
        'api_frontend_config',
    ];

    /**
     * @var list<string>
     */
    private const array ALLOWED_PATH_PREFIXES = [
        '/api/docs'
    ];

    /**
     * @var list<string>
     */
    private const ALLOWED_ROUTE_PREFIXES = [
        '_error',
        '_profiler',
        '_wdt',
    ];

    public function __construct(
        private InitialAdminManager $initialAdminManager,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 8],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $route = $request->attributes->get('_route');
        if (!is_string($route) || $route === '') {
            return;
        }

        if (in_array($route, self::ALLOWED_ROUTES, true)) {
            return;
        }

        foreach (self::ALLOWED_ROUTE_PREFIXES as $prefix) {
            if (str_starts_with($route, $prefix)) {
                return;
            }
        }

        $pathInfo = $request->getPathInfo();
        foreach (self::ALLOWED_PATH_PREFIXES as $prefix) {
            if (str_starts_with($pathInfo, $prefix) && $request->isMethodSafe()) {
                return;
            }
        }

        if ($this->initialAdminManager->needsBootstrap()) {
            throw new InitialAdminRequiredException();
        }
    }
}
