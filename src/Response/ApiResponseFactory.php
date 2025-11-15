<?php

namespace App\Response;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class ApiResponseFactory
{
    private const ERROR_MESSAGES = [
        'CSRF_TOKEN_INVALID' => 'Invalid CSRF token.',
        'INVALID_PAYLOAD' => 'Invalid request payload.',
        'INVALID_CREDENTIALS' => 'Invalid credentials.',
        'RATE_LIMIT' => 'Too many requests. Please try again later.',
        'INVALID_REGISTRATION' => 'Registration failed due to invalid data.',
        'REFRESH_TOKEN_MISSING' => 'Refresh token missing or expired.',
        'REFRESH_TOKEN_INVALID' => 'Refresh token invalid.',
        'TOKEN_ID_INVALID' => 'Invalid CSRF token identifier.',
        'INVALID_REQUEST' => 'Request data is missing or invalid.',
        'EMPTY_PASSWORD' => 'Password must not be empty.',
        'INVALID_TOKEN' => 'The provided token is invalid or expired.',
        'INVALID_USER' => 'The token does not belong to a known user.',
        'EMAIL_MISSING' => 'Email address is missing.',
        'EMAIL_SEND_FAILED' => 'Unable to send the email at the moment.',
        'INITIAL_ADMIN_REQUIRED' => 'An administrator must be created before using this endpoint.',
        'INITIAL_ADMIN_ALREADY_CREATED' => 'An administrator already exists.',
    ];

    /**
     * @param array<string, mixed> $payload
     */
    public function error(string $errorCode, int $statusCode = Response::HTTP_BAD_REQUEST, array $payload = []): JsonResponse
    {
        $message = self::ERROR_MESSAGES[$errorCode] ?? 'An unexpected error occurred. Please try again.';

        $body = array_merge(
            ['error' => $errorCode, 'message' => $message],
            $payload
        );

        return new JsonResponse($body, $statusCode);
    }
}
