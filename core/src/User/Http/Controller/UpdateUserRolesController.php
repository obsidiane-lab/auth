<?php

namespace App\User\Http\Controller;

use App\Entity\User;
use App\Shared\Http\JsonRequestDecoderTrait;
use App\Repository\UserRepository;
use App\Shared\Response\ApiResponseFactory;
use App\Shared\Response\UserPayloadFactory;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\Exception\NotEncodableValueException;

#[AsController]
#[IsGranted('ROLE_ADMIN')]
final class UpdateUserRolesController extends AbstractController
{
    use JsonRequestDecoderTrait;

    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly ApiResponseFactory $responses,
        private readonly UserPayloadFactory $userPayloadFactory,
    ) {
    }

    public function __invoke(Request $request, int $id): JsonResponse
    {
        try {
            $payload = $this->decodeJson($request);
        } catch (NotEncodableValueException) {
            return $this->responses->error('INVALID_PAYLOAD', Response::HTTP_BAD_REQUEST);
        }

        $rolesInput = $payload['roles'] ?? null;

        if (!is_array($rolesInput)) {
            return $this->responses->error('INVALID_ROLES', Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $roles = [];
        foreach ($rolesInput as $role) {
            if (!is_string($role)) {
                return $this->responses->error('INVALID_ROLES', Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            $normalized = strtoupper(trim($role));

            if ($normalized === '' || !str_starts_with($normalized, 'ROLE_')) {
                return $this->responses->error('INVALID_ROLES', Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            $roles[] = $normalized;
        }

        $roles = array_values(array_unique($roles));

        $user = $this->userRepository->find($id);
        if (!$user instanceof User) {
            return $this->responses->error('USER_NOT_FOUND', Response::HTTP_NOT_FOUND);
        }

        $user->setRoles($roles);
        $this->entityManager->flush();

        return new JsonResponse([
            'user' => $this->userPayloadFactory->create($user),
        ]);
    }
}
