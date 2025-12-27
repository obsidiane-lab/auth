<?php

namespace App\Auth\Infrastructure\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;

final readonly class JsonLoginFailureHandler implements AuthenticationFailureHandlerInterface
{
    public function __construct(
        private AuthenticationFailureHandlerInterface $decorated,
    ) {
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): Response
    {
        if ($exception instanceof CustomUserMessageAuthenticationException && $exception->getMessageKey() === 'EMAIL_NOT_VERIFIED') {
            return new JsonResponse([
                'error' => 'EMAIL_NOT_VERIFIED',
                'message' => 'auth.login.error.api.EMAIL_NOT_VERIFIED',
                'code' => Response::HTTP_UNAUTHORIZED,
            ], Response::HTTP_UNAUTHORIZED);
        }

        return $this->decorated->onAuthenticationFailure($request, $exception);
    }
}
