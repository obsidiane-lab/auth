<?php

namespace App\Auth;

use App\Auth\Dto\RegisterUserInput;
use App\Auth\Exception\RegistrationException;
use App\Entity\InviteUser;
use App\Entity\User;
use App\Mail\MailDispatchException;
use App\Mail\MailerGateway;
use App\Repository\InviteUserRepository;
use App\Repository\UserRepository;
use App\Security\PasswordStrengthChecker;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Validator\ConstraintViolationInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final readonly class InvitationManager
{
    public function __construct(
        private UserRepository $userRepository,
        private InviteUserRepository $inviteRepository,
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private ValidatorInterface $validator,
        private MailerGateway $mailer,
        private UrlGeneratorInterface $router,
        private Security $security,
        private PasswordStrengthChecker $passwordStrengthChecker,
        #[Autowire('%env(string:NOTIFUSE_TEMPLATE_WELCOME)%')]
        private string $welcomeTemplateId = 'welcome',
    ) {
    }

    /**
     * @throws RegistrationException
     * @throws MailDispatchException
     */
    public function invite(string $email): InviteUser
    {
        $normalizedEmail = mb_strtolower(trim($email));

        if ($normalizedEmail === '') {
            throw new RegistrationException(['email' => 'INVALID_EMAIL']);
        }

        $existingUser = $this->userRepository->findOneBy(['email' => $normalizedEmail]);

        if ($existingUser instanceof User && $existingUser->isEmailVerified()) {
            throw new RegistrationException(['email' => 'EMAIL_ALREADY_USED']);
        }

        $user = $existingUser ?? $this->createInvitedUser($normalizedEmail);

        $existingInvite = $this->inviteRepository->findOneBy(['user' => $user]);

        if ($existingInvite instanceof InviteUser && !$existingInvite->isAccepted() && !$existingInvite->isExpired()) {
            $this->sendInvitationEmail($existingInvite);

            return $existingInvite;
        }

        $invite = $existingInvite ?? new InviteUser();

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

    /**
     * @throws RegistrationException
     */
    public function complete(string $token, string $plainPassword): User
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

        if (!$this->passwordStrengthChecker->isStrongEnough($plainPassword)) {
            throw new RegistrationException(['plainPassword' => 'INVALID_PASSWORD']);
        }

        $input = new RegisterUserInput();
        $input->email = $user->getEmail();
        $input->plainPassword = $plainPassword;

        $violations = $this->validator->validate($input, groups: ['user:register']);

        if (count($violations) > 0) {
            $errors = [];

            foreach ($violations as $violation) {
                $path = $violation->getPropertyPath();
                $errors[$path] = $this->mapViolationToCode($path, $violation);
            }

            throw new RegistrationException($errors);
        }

        $user->setPassword($this->passwordHasher->hashPassword($user, $plainPassword));
        $user->eraseCredentials();
        $user->setEmailVerified(true);

        $invite->setAcceptedAt(new \DateTimeImmutable());

        $this->entityManager->flush();

        return $user;
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
    private function sendInvitationEmail(InviteUser $invite): void
    {
        $recipient = $invite->getEmail();

        if ($recipient === '') {
            return;
        }

        $url = $this->router->generate(
            'auth_invite_complete_page',
            ['token' => $invite->getToken()],
            UrlGeneratorInterface::ABSOLUTE_URL
        );

        $this->mailer->dispatch($recipient, $this->welcomeTemplateId, [
            'first_name' => $recipient,
            'activate_link' => $url,
        ]);
    }

    private function mapViolationToCode(string $path, ConstraintViolationInterface $violation): string
    {
        return match ($path) {
            'email' => 'INVALID_EMAIL',
            'plainPassword' => 'INVALID_PASSWORD',
            default => $violation->getMessage(),
        };
    }
}
