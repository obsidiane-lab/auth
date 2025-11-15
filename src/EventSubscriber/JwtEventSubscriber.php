<?php

namespace App\EventSubscriber;

use App\Auth\TokenCookieFactory;
use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

final readonly class JwtEventSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private TokenCookieFactory $cookieFactory,
        #[Autowire('%env(string:JWT_ISSUER)%')]
        private string $issuer,
        #[Autowire('%env(string:JWT_AUDIENCE)%')]
        private string $audience,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            Events::JWT_CREATED => 'onJwtCreated',
            Events::AUTHENTICATION_SUCCESS => 'onAuthenticationSuccess',
        ];
    }

    public function onJwtCreated(JWTCreatedEvent $event): void
    {
        $user = $event->getUser();
        if (!$user instanceof User) {
            return;
        }

        $now = new \DateTimeImmutable();
        $ttl = $this->cookieFactory->getAccessTtl();
        $expiresAt = $ttl > 0 ? $now->modify(sprintf('+%d seconds', $ttl)) : $now;

        $payload = $event->getData();
        $payload['iss'] = $this->issuer;
        $payload['aud'] = $this->audience;
        $payload['sub'] = $user->getUserIdentifier();
        $payload['iat'] = $now;
        $payload['nbf'] = $now;
        $payload['exp'] = $expiresAt;
        $payload['jti'] = bin2hex(random_bytes(16));

        $event->setData($payload);
    }

    public function onAuthenticationSuccess(AuthenticationSuccessEvent $event): void
    {
        $user = $event->getUser();
        if (!$user instanceof User) {
            return;
        }

        $data = $event->getData();
        $token = isset($data['token']) && is_string($data['token']) ? $data['token'] : null;

        if ($token === null || $token === '') {
            return;
        }

        $event->getResponse()->headers->setCookie($this->cookieFactory->createAccessTokenCookie($token));

        $expiresAt = $this->cookieFactory->getAccessTtl();
        $payload = [
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles(),
                'displayName' => $user->getDisplayName(),
            ],
            'exp' => $expiresAt > 0 ? time() + $expiresAt : time(),
        ];

        $event->setData($payload);
    }
}
