<?php

namespace App\Shared\EventSubscriber;

use App\Shared\Response\ApiResponseFactory;
use App\Shared\Security\CsrfRequestValidator;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

final class CsrfProtectedRoutesSubscriber implements EventSubscriberInterface
{
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
        private CsrfRequestValidator $csrfValidator,
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

        if ($this->csrfValidator->isValid($request)) {
            return;
        }

        if (isset(self::SOFT_PATHS[$path])) {
            $config = self::SOFT_PATHS[$path];
            $event->setResponse(new JsonResponse($config['payload'], $config['status']));

            return;
        }

        $event->setResponse($this->responses->error('CSRF_TOKEN_INVALID', Response::HTTP_FORBIDDEN));
    }
}
