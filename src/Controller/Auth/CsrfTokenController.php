<?php

namespace App\Controller\Auth;

use App\Response\ApiResponseFactory;
use App\Security\CsrfTokenId;
use App\Security\CsrfTokenProvider;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class CsrfTokenController extends AbstractController
{
    public function __construct(
        private readonly CsrfTokenProvider $csrfTokenProvider,
        private readonly ApiResponseFactory $responses,
    ) {
    }

    public function __invoke(string $tokenId): JsonResponse
    {
        $token = CsrfTokenId::fromValue($tokenId);

        if ($token === null) {
            return $this->responses->error('TOKEN_ID_INVALID', Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse([
            'token_id' => $token->value,
            'token' => $this->csrfTokenProvider->token($token),
        ]);
    }
}
