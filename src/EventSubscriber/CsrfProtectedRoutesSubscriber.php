<?php

namespace App\EventSubscriber;

use App\Response\ApiResponseFactory;
use App\Security\CsrfRequestValidator;
use App\Security\CsrfTokenId;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

final class CsrfProtectedRoutesSubscriber implements EventSubscriberInterface
{
    /**
     * @var array<string, array{token: CsrfTokenId, soft?: bool, response?: array<mixed>|null, status?: int}>
     */
    private array $routeMap = [
        'api_login' => ['token' => CsrfTokenId::AUTHENTICATE],
        'api_auth_register' => ['token' => CsrfTokenId::REGISTER],
        'api_setup_initial_admin' => ['token' => CsrfTokenId::INITIAL_ADMIN],
        'api_auth_invite' => ['token' => CsrfTokenId::INVITE_USER],
        'api_auth_invite_complete' => ['token' => CsrfTokenId::INVITE_COMPLETE],
        // Password reset flow via ResetPasswordBundle UI routes
        'app_forgot_password_request' => [
            'token' => CsrfTokenId::PASSWORD_REQUEST,
            'soft' => true,
            'response' => ['status' => 'OK'],
            'status' => Response::HTTP_ACCEPTED,
        ],
        'app_reset_password' => ['token' => CsrfTokenId::PASSWORD_RESET],
        'api_auth_logout' => ['token' => CsrfTokenId::LOGOUT],
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
        $tokenId = $config['token'];
        if ($this->csrfValidator->isValid($request, $tokenId)) {
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
