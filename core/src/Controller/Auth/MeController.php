<?php

namespace App\Controller\Auth;

use App\Entity\User;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\Normalizer\AbstractNormalizer;
use Symfony\Component\Serializer\SerializerInterface;

#[AsController]
final class MeController extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly SerializerInterface $serializer,
    ) {
    }

    public function __invoke(): JsonResponse
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            return new JsonResponse(null, Response::HTTP_UNAUTHORIZED);
        }

        return new JsonResponse([
            'user' => $this->serializer->normalize($user, 'json', [AbstractNormalizer::GROUPS => ['user:read']]),
        ]);
    }
}
