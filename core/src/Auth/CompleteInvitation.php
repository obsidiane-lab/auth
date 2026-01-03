<?php

namespace App\Auth;

use App\Entity\InviteUser;
use App\Entity\User;
use App\Repository\InviteUserRepository;
use App\Exception\Auth\InvitationAlreadyUsedException;
use App\Security\UserPasswordUpdater;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\GoneHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final readonly class CompleteInvitation
{
    public function __construct(
        private InviteUserRepository $inviteRepository,
        private EntityManagerInterface $entityManager,
        private UserPasswordUpdater $passwordUpdater,
    ) {
    }

    public function handle(string $token, string $plainPassword): User
    {
        $invite = $this->inviteRepository->findOneBy(['token' => $token]);

        if (!$invite instanceof InviteUser) {
            throw new NotFoundHttpException('Invalid invitation.');
        }

        if ($invite->isAccepted()) {
            throw new InvitationAlreadyUsedException();
        }

        if ($invite->isExpired()) {
            throw new GoneHttpException('Invitation has expired.');
        }

        $user = $invite->getUser();

        $this->passwordUpdater->apply($user, $plainPassword);
        $user->setEmailVerified(true);

        $invite->setAcceptedAt(new \DateTimeImmutable());

        $this->entityManager->flush();

        return $user;
    }
}
