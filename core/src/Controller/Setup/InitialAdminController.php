<?php

namespace App\Controller\Setup;

use App\Dto\Auth\RegisterUserInput;
use App\Setup\InitialAdminManager;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\Normalizer\AbstractNormalizer;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

#[AsController]
final class InitialAdminController extends AbstractController
{
    public function __construct(
        private readonly InitialAdminManager $initialAdminManager,
        private readonly NormalizerInterface $normalizer,
    ) {
    }

    public function __invoke(RegisterUserInput $input): JsonResponse
    {
        $user = $this->initialAdminManager->createInitialAdmin($input);

        return new JsonResponse([
            'user' => $this->normalizer->normalize($user, 'json', [AbstractNormalizer::GROUPS => ['user:read']]),
        ], Response::HTTP_CREATED);
    }
}
