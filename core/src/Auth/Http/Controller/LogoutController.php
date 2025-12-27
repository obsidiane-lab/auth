<?php

namespace App\Auth\Http\Controller;

use App\Auth\Infrastructure\Security\TokenCookieFactory;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\BlockedTokenManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class LogoutController extends AbstractController
{
    public function __construct(
        private readonly JWTTokenManagerInterface $jwtManager,
        private readonly BlockedTokenManagerInterface $blockedTokenManager,
        private readonly RefreshTokenManagerInterface $refreshTokenManager,
        private readonly TokenCookieFactory $cookieFactory,
    ) {
    }

    public function __invoke(Request $request): Response
    {
        $tokenString = $this->extractAccessToken($request);

        if (null !== $tokenString) {
            try {
                $payload = $this->jwtManager->parse($tokenString);
                $this->blockedTokenManager->add($payload);
            } catch (\Throwable) {
                // Ignore parsing errors to ensure cookies are invalidated.
            }
        }

        $refreshTokenValue = $request->cookies->get($this->cookieFactory->getRefreshCookieName());

        if (is_string($refreshTokenValue) && $refreshTokenValue !== '') {
            $model = $this->refreshTokenManager->get($refreshTokenValue);

            if ($model instanceof RefreshTokenInterface) {
                $this->refreshTokenManager->delete($model);
            }
        }

        $response = new Response(null, Response::HTTP_NO_CONTENT);

        return $this->expireCookies($response);
    }

    private function extractAccessToken(Request $request): ?string
    {
        $header = $request->headers->get('Authorization');

        if (is_string($header) && str_starts_with($header, 'Bearer ')) {
            return substr($header, 7);
        }

        $cookie = $request->cookies->get($this->cookieFactory->getAccessCookieName());

        return is_string($cookie) && $cookie !== '' ? $cookie : null;
    }

    private function expireCookies(Response $response): Response
    {
        $response->headers->setCookie($this->cookieFactory->expireCookie($this->cookieFactory->getAccessCookieName()));
        $response->headers->setCookie($this->cookieFactory->expireRefreshCookie());

        return $response;
    }

}
