<?php

namespace App\Controller\Auth;

use App\Auth\CompleteInvitation;
use App\Dto\Auth\InviteCompleteInput;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\Normalizer\AbstractNormalizer;
use Symfony\Component\Serializer\SerializerInterface;

#[AsController]
final class AcceptInvitationController extends AbstractController
{
    public function __construct(
        private readonly CompleteInvitation $completeInvitation,
        private readonly SerializerInterface $serializer,
    ) {
    }

    public function __invoke(InviteCompleteInput $input): JsonResponse
    {
        // Input is already validated by Symfony validator
        $user = $this->completeInvitation->handle($input->token, $input->password);

        return new JsonResponse([
            'user' => $this->serializer->normalize($user, 'json', [AbstractNormalizer::GROUPS => ['user:read']]),
        ], Response::HTTP_CREATED);
    }
}
