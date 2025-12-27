<?php

namespace App\Shared\EventSubscriber;

use App\Shared\Response\ApiResponseFactory;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;

final class RateLimitSubscriber implements EventSubscriberInterface
{
    /**
     * @var array<string, RateLimiterFactory>
     */
    private array $limiters;

    public function __construct(
        #[Autowire(service: 'limiter.auth_register')]
        RateLimiterFactory $registerLimiter,
        #[Autowire(service: 'limiter.auth_invite')]
        RateLimiterFactory $inviteLimiter,
        #[Autowire(service: 'limiter.auth_invite_complete')]
        RateLimiterFactory $inviteCompleteLimiter,
        #[Autowire(service: 'limiter.auth_password_forgot')]
        RateLimiterFactory $passwordForgotLimiter,
        #[Autowire(service: 'limiter.auth_password_reset')]
        RateLimiterFactory $passwordResetLimiter,
        #[Autowire(service: 'limiter.setup_initial_admin')]
        RateLimiterFactory $initialAdminLimiter,
        private ApiResponseFactory $responses,
    ) {
        $this->limiters = [
            'api_auth_register' => $registerLimiter,
            'api_auth_invite' => $inviteLimiter,
            'api_auth_invite_complete' => $inviteCompleteLimiter,
            'api_auth_password_forgot' => $passwordForgotLimiter,
            'api_auth_password_reset' => $passwordResetLimiter,
            'api_setup_initial_admin' => $initialAdminLimiter,
        ];
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 16],
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

        if (!is_string($routeName) || !isset($this->limiters[$routeName])) {
            return;
        }

        $limiter = $this->limiters[$routeName]->create($this->resolveLimiterKey($request));
        $limit = $limiter->consume(1);

        if ($limit->isAccepted()) {
            return;
        }

        $response = $this->responses->error('RATE_LIMIT', Response::HTTP_TOO_MANY_REQUESTS);

        $retryAfter = $limit->getRetryAfter();
        if ($retryAfter !== null) {
            $retryAfterSeconds = max(0, $retryAfter->getTimestamp() - time());
            $response->headers->set('Retry-After', (string) $retryAfterSeconds);
        }

        $event->setResponse($response);
    }

    private function resolveLimiterKey(Request $request): string
    {
        $ip = $request->getClientIp();

        return is_string($ip) && $ip !== '' ? $ip : 'anonymous';
    }
}
