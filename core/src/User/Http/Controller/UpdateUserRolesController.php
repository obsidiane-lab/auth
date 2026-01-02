<?php

namespace App\User\Http\Controller;

use App\Entity\User;
use App\Shared\Http\JsonRequestDecoderTrait;
use App\Repository\UserRepository;
use App\Shared\Response\UserPayloadFactory;
use App\Shared\Http\Exception\InvalidPayloadException;
use App\Shared\Http\Exception\InvalidRolesException;
use App\Shared\Http\Exception\UserNotFoundException;
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
        private readonly UserPayloadFactory $userPayloadFactory,
    ) {
    }

    public function __invoke(Request $request, int $id): JsonResponse
    {
        try {
            $payload = $this->decodeJson($request);
        } catch (NotEncodableValueException) {
            throw new InvalidPayloadException();
        }

        $rolesInput = $payload['roles'] ?? null;

        if (!is_array($rolesInput)) {
            throw new InvalidRolesException(['roles' => 'INVALID_ROLES']);
        }

        $roles = [];
        foreach ($rolesInput as $role) {
            if (!is_string($role)) {
                throw new InvalidRolesException(['roles' => 'INVALID_ROLES']);
            }

            $normalized = strtoupper(trim($role));

            if ($normalized === '' || !str_starts_with($normalized, 'ROLE_')) {
                throw new InvalidRolesException(['roles' => 'INVALID_ROLES']);
            }

            $roles[] = $normalized;
        }

        $roles = array_values(array_unique($roles));

        $user = $this->userRepository->find($id);
        if (!$user instanceof User) {
            throw new UserNotFoundException();
        }

        $user->setRoles($roles);
        $this->entityManager->flush();

        return new JsonResponse([
            'user' => $this->userPayloadFactory->create($user),
        ]);
    }
}
