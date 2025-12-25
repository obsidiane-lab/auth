<?php

namespace App\Response;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class ApiResponseFactory
{
    private const ERROR_MESSAGES = [
        'CSRF_TOKEN_INVALID' => 'Jeton CSRF invalide. Merci de réessayer.',
        'INVALID_PAYLOAD' => 'Requête invalide.',
        'INVALID_CREDENTIALS' => 'Identifiants invalides.',
        'EMAIL_ALREADY_USED' => 'Un compte actif existe déjà pour cet email.',
        'RATE_LIMIT' => 'Trop de tentatives. Réessayez plus tard.',
        'INVALID_REGISTRATION' => 'Données d’inscription invalides.',
        'REFRESH_TOKEN_MISSING' => 'Refresh token manquant ou expiré.',
        'REFRESH_TOKEN_INVALID' => 'Refresh token invalide.',
        'INVALID_REQUEST' => 'Requête invalide.',
        'EMPTY_PASSWORD' => 'Le mot de passe ne doit pas être vide.',
        'INVALID_TOKEN' => 'Le jeton fourni est invalide ou expiré.',
        'INVALID_USER' => 'Le jeton ne correspond à aucun utilisateur connu.',
        'EMAIL_MISSING' => 'Adresse email manquante.',
        'EMAIL_SEND_FAILED' => 'Impossible d’envoyer l’email pour le moment.',
        'INITIAL_ADMIN_REQUIRED' => 'Un administrateur doit être créé avant d’utiliser cet endpoint.',
        'INITIAL_ADMIN_ALREADY_CREATED' => 'Un administrateur existe déjà.',
        'INVALID_INVITATION' => 'Invitation invalide ou expirée.',
        'INVALID_INVITATION_PAYLOAD' => 'Données d’invitation invalides.',
        'INVALID_ROLES' => 'La liste des roles est invalide.',
        'USER_NOT_FOUND' => 'Utilisateur introuvable.',
    ];

    /**
     * @param array<string, mixed> $payload
     */
    public function error(string $errorCode, int $statusCode = Response::HTTP_BAD_REQUEST, array $payload = []): JsonResponse
    {
        $message = self::ERROR_MESSAGES[$errorCode] ?? 'Un problème est survenu. Merci de réessayer.';

        $body = array_merge(
            ['error' => $errorCode, 'message' => $message],
            $payload
        );

        return new JsonResponse($body, $statusCode);
    }
}
