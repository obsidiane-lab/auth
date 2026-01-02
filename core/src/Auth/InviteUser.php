<?php

namespace App\Auth;

use App\Entity\InviteUser as InviteUserEntity;
use App\Entity\User;
use App\Dto\Auth\InviteUserInput;
use App\Exception\Mail\MailDispatchException;
use App\Exception\Auth\EmailAlreadyUsedException;
use App\Mail\MailerGateway;
use App\Repository\InviteUserRepository;
use App\Repository\UserRepository;
use App\Frontend\FrontendUrlBuilder;
use App\Utils\EmailNormalizer;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

final readonly class InviteUser
{
    public function __construct(
        private UserRepository $userRepository,
        private InviteUserRepository $inviteRepository,
        private EntityManagerInterface $entityManager,
        private MailerGateway $mailer,
        private FrontendUrlBuilder $frontendUrlBuilder,
        private Security $security,
        private EmailNormalizer $emailNormalizer,
        private UserFactory $userFactory,
        #[Autowire('%env(string:NOTIFUSE_TEMPLATE_WELCOME)%')]
        private string $welcomeTemplateId = 'welcome',
    ) {
    }

    public function handle(InviteUserInput $input): InviteUserEntity
    {
        // Input is already validated by Symfony validator
        $normalizedEmail = $this->emailNormalizer->normalize($input->email ?? '');

        $existingUser = $this->userRepository->findOneBy(['email' => $normalizedEmail]);

        if ($existingUser instanceof User && $existingUser->isEmailVerified()) {
            throw new EmailAlreadyUsedException();
        }

        $user = $existingUser ?? $this->userFactory->createWithRandomPassword($normalizedEmail);

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
        $invite->setAcceptedAt(null);

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
