<?php

namespace App\EventSubscriber;

use App\Response\ApiResponseFactory;
use App\Security\CsrfRequestValidator;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

final class CsrfProtectedRoutesSubscriber implements EventSubscriberInterface
{
    /**
     * @var array<string, array{soft?: bool, response?: array<mixed>|null, status?: int}>
     */
    private array $routeMap = [
        'api_login' => [],
        'api_auth_register' => [],
        'api_setup_initial_admin' => [],
        'api_auth_invite' => [],
        'api_auth_invite_complete' => [],
        'app_forgot_password_request' => [
            'soft' => true,
            'response' => ['status' => 'OK'],
            'status' => Response::HTTP_ACCEPTED,
        ],
        'app_reset_password' => [],
        'api_auth_logout' => [],
        'api_auth_password_forgot' => [
            'soft' => true,
            'response' => ['status' => 'OK'],
            'status' => Response::HTTP_ACCEPTED,
        ],
        'api_auth_password_reset' => [],
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

        if (!$request->isMethod('POST')) {
            return;
        }

        $routeName = $request->attributes->get('_route');

        if (!is_string($routeName) || !isset($this->routeMap[$routeName])) {
            return;
        }

        $config = $this->routeMap[$routeName];

        if ($this->csrfValidator->isValid($request)) {
            return;
        }

        if (($config['soft'] ?? false) === true) {
            $payload = $config['response'] ?? ['status' => 'OK'];
            $status = $config['status'] ?? Response::HTTP_ACCEPTED;
            $event->setResponse(new JsonResponse($payload, $status));

            return;
        }

        $event->setResponse($this->responses->error('CSRF_TOKEN_INVALID', Response::HTTP_FORBIDDEN));
    }
}
