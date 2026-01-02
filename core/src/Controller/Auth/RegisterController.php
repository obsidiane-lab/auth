<?php

namespace App\Controller\Auth;

use App\Dto\Auth\RegisterUserInput;
use App\Auth\RegisterUser;
use App\Config\FeatureFlags;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Serializer\Normalizer\AbstractNormalizer;
use Symfony\Component\Serializer\SerializerInterface;

#[AsController]
final class RegisterController extends AbstractController
{
    public function __construct(
        private readonly RegisterUser $registerUser,
        private readonly FeatureFlags $featureFlags,
        private readonly SerializerInterface $serializer,
    ) {
    }

    public function __invoke(RegisterUserInput $input): JsonResponse
    {
        if (!$this->featureFlags->isRegistrationEnabled()) {
            throw new NotFoundHttpException();
        }

        $user = $this->registerUser->handle($input);

        return new JsonResponse([
            'user' => $this->serializer->normalize($user, 'json', [AbstractNormalizer::GROUPS => ['user:read']]),
        ], Response::HTTP_CREATED);
    }
}
