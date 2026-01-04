<?php

namespace App\Controller\User;

use App\Entity\User;
use App\Dto\User\UpdateUserRolesInput;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\Normalizer\AbstractNormalizer;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

#[AsController]
#[IsGranted('ROLE_ADMIN')]
final class UpdateUserRolesController extends AbstractController
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly NormalizerInterface $normalizer,
    ) {
    }

    public function __invoke(UpdateUserRolesInput $input, int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user instanceof User) {
            throw new NotFoundHttpException('User not found.');
        }

        $rolesInput = is_array($input->roles) ? $input->roles : [];
        $roles = [];

        foreach ($rolesInput as $role) {
            $roles[] = strtoupper(trim($role));
        }

        $roles = array_values(array_unique($roles));

        $user->setRoles($roles);
        $this->entityManager->flush();

        return new JsonResponse([
            'user' => $this->normalizer->normalize($user, 'json', [AbstractNormalizer::GROUPS => ['user:read']]),
        ]);
    }
}
