<?php

namespace App\Auth\Application;

use App\Auth\Http\Dto\RegisterUserInput;
use App\Entity\InviteUser;
use App\Entity\User;
use App\Repository\InviteUserRepository;
use App\Shared\Http\Exception\InvalidInvitationException;
use App\Shared\Http\Exception\InvitationAlreadyUsedException;
use App\Shared\Http\Exception\InvitationExpiredException;
use App\Shared\Security\UserPasswordUpdater;
use Doctrine\ORM\EntityManagerInterface;

final readonly class CompleteInvitation
{
    public function __construct(
        private InviteUserRepository $inviteRepository,
        private EntityManagerInterface $entityManager,
        private UserPasswordUpdater $passwordUpdater,
        private RegisterUserInputValidator $inputValidator,
    ) {
    }

    public function handle(string $token, string $plainPassword): User
    {
        $invite = $this->inviteRepository->findOneBy(['token' => $token]);

        if (!$invite instanceof InviteUser) {
            throw new InvalidInvitationException();
        }

        if ($invite->isAccepted()) {
            throw new InvitationAlreadyUsedException();
        }

        if ($invite->isExpired()) {
            throw new InvitationExpiredException();
        }

        $user = $invite->getUser();

        $input = new RegisterUserInput();
        $input->email = $user->getEmail();
        $input->plainPassword = $plainPassword;

        $this->inputValidator->validate($input);

        $this->passwordUpdater->apply($user, $plainPassword);
        $user->setEmailVerified(true);

        $invite->setAcceptedAt(new \DateTimeImmutable());

        $this->entityManager->flush();

        return $user;
    }
}
