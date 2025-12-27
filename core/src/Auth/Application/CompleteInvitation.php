<?php

namespace App\Auth\Application;

use App\Auth\Domain\Exception\RegistrationException;
use App\Auth\Http\Dto\RegisterUserInput;
use App\Entity\InviteUser;
use App\Entity\User;
use App\Repository\InviteUserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final readonly class CompleteInvitation
{
    public function __construct(
        private InviteUserRepository $inviteRepository,
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private RegisterUserInputValidator $inputValidator,
    ) {
    }

    /**
     * @throws RegistrationException
     */
    public function handle(string $token, string $plainPassword): User
    {
        $invite = $this->inviteRepository->findOneBy(['token' => $token]);

        if (!$invite instanceof InviteUser) {
            throw new RegistrationException(['token' => 'INVALID_INVITATION'], 'INVALID_INVITATION');
        }

        if ($invite->isAccepted()) {
            throw new RegistrationException(['token' => 'INVITATION_ALREADY_USED'], 'INVITATION_ALREADY_USED');
        }

        if ($invite->isExpired()) {
            throw new RegistrationException(['token' => 'INVITATION_EXPIRED'], 'INVITATION_EXPIRED');
        }

        $user = $invite->getUser();

        $input = new RegisterUserInput();
        $input->email = $user->getEmail();
        $input->plainPassword = $plainPassword;

        $this->inputValidator->validate($input);

        $user->setPassword($this->passwordHasher->hashPassword($user, $plainPassword));
        $user->eraseCredentials();
        $user->setEmailVerified(true);

        $invite->setAcceptedAt(new \DateTimeImmutable());

        $this->entityManager->flush();

        return $user;
    }
}
