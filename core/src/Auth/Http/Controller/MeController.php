<?php

namespace App\Auth\Http\Controller;

use App\Entity\User;
use App\Shared\Response\UserPayloadFactory;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class MeController extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly UserPayloadFactory $userPayloadFactory,
    ) {
    }

    public function __invoke(): JsonResponse
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            return new JsonResponse(null, Response::HTTP_UNAUTHORIZED);
        }

        return new JsonResponse([
            'user' => $this->userPayloadFactory->create($user),
        ]);
    }
}
