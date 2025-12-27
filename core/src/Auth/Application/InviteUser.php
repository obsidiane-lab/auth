<?php

namespace App\Auth\Application;

use App\Auth\Domain\Exception\RegistrationException;
use App\Entity\InviteUser as InviteUserEntity;
use App\Entity\User;
use App\Auth\Http\Dto\InviteUserInput;
use App\Shared\Mail\MailDispatchException;
use App\Shared\Mail\MailerGateway;
use App\Repository\InviteUserRepository;
use App\Repository\UserRepository;
use App\Shared\Frontend\FrontendUrlBuilder;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final readonly class InviteUser
{
    public function __construct(
        private UserRepository $userRepository,
        private InviteUserRepository $inviteRepository,
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private InviteUserInputValidator $inputValidator,
        private MailerGateway $mailer,
        private FrontendUrlBuilder $frontendUrlBuilder,
        private Security $security,
        #[Autowire('%env(string:NOTIFUSE_TEMPLATE_WELCOME)%')]
        private string $welcomeTemplateId = 'welcome',
    ) {
    }

    /**
     * @throws RegistrationException
     * @throws MailDispatchException
     */
    public function handle(InviteUserInput $input): InviteUserEntity
    {
        $this->inputValidator->validate($input);
        $normalizedEmail = mb_strtolower(trim((string) $input->email));

        $existingUser = $this->userRepository->findOneBy(['email' => $normalizedEmail]);

        if ($existingUser instanceof User && $existingUser->isEmailVerified()) {
            throw new RegistrationException(['email' => 'EMAIL_ALREADY_USED']);
        }

        $user = $existingUser ?? $this->createInvitedUser($normalizedEmail);

        $existingInvite = $this->inviteRepository->findOneBy(['user' => $user]);

        if ($existingInvite instanceof InviteUserEntity && !$existingInvite->isAccepted() && !$existingInvite->isExpired()) {
            $this->sendInvitationEmail($existingInvite);

            return $existingInvite;
        }

        $invite = $existingInvite ?? new InviteUserEntity();

        $invite->setEmail($normalizedEmail);
        $invite->setUser($user);

        $now = new \DateTimeImmutable();
        $invite->setCreatedAt($now);
        $invite->setExpiresAt($now->modify('+7 days'));
        $invite->setToken(bin2hex(random_bytes(32)));

        $actor = $this->security->getUser();
        if ($actor instanceof User) {
            $invite->setCreatedBy($actor);
        }

        $this->entityManager->persist($user);
        $this->entityManager->persist($invite);
        $this->entityManager->flush();

        $this->sendInvitationEmail($invite);

        return $invite;
    }

    private function createInvitedUser(string $email): User
    {
        $user = new User();
        $user->setEmail($email);

        $randomPassword = bin2hex(random_bytes(16));
        $user->setPassword($this->passwordHasher->hashPassword($user, $randomPassword));
        $user->eraseCredentials();
        $user->setRoles([]);
        $user->setEmailVerified(false);

        return $user;
    }

    /**
     * @throws MailDispatchException
     */
    private function sendInvitationEmail(InviteUserEntity $invite): void
    {
        $recipient = $invite->getEmail();

        if ($recipient === '') {
            return;
        }

        $url = $this->frontendUrlBuilder->inviteCompleteUrl($invite->getToken());

        $this->mailer->dispatch($recipient, $this->welcomeTemplateId, [
            'first_name' => $recipient,
            'activate_link' => $url,
        ]);
    }
}
