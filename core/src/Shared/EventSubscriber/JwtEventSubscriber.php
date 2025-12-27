<?php

namespace App\Shared\EventSubscriber;

use App\Auth\Infrastructure\Security\TokenCookieFactory;
use App\Entity\User;
use App\Shared\Response\UserPayloadFactory;
use Doctrine\ORM\EntityManagerInterface;
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
        private EntityManagerInterface $entityManager,
        private UserPayloadFactory $userPayloadFactory,
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

        $now = new \DateTimeImmutable();
        $user->setLastLoginAt($now);
        $this->entityManager->flush();

        $event->getResponse()->headers->setCookie($this->cookieFactory->createAccessTokenCookie($token));

        $expiresAt = $this->cookieFactory->getAccessTtl();
        $payload = [
            'user' => $this->userPayloadFactory->create($user),
            'exp' => $expiresAt > 0 ? time() + $expiresAt : time(),
        ];

        $event->setData($payload);
    }
}
