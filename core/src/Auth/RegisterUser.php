<?php

namespace App\Auth;

use App\Dto\Auth\RegisterUserInput;
use App\Exception\Auth\EmailAlreadyUsedException;
use App\Entity\User;
use App\Exception\Mail\MailDispatchException;
use App\Mail\MailerGateway;
use App\Security\EmailVerifier;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

final readonly class RegisterUser
{
    public function __construct(
        private EntityManagerInterface     $entityManager,
        private MailerGateway              $mailer,
        private EmailVerifier              $emailVerifier,
        private UserFactory                $userFactory,
        #[Autowire('%env(string:NOTIFUSE_TEMPLATE_WELCOME)%')]
        private string                     $welcomeTemplateId = 'welcome',
    )
    {
    }

    /**
     * @throws EmailAlreadyUsedException
     * @throws MailDispatchException
     */
    public function handle(RegisterUserInput $input, bool $sendWelcomeEmail = true): User
    {
        // Input is already validated by Symfony validator
        $plainPassword = $input->plainPassword ?? '';

        $user = $this->userFactory->create(($input->email ?? ''), $plainPassword);

        $this->entityManager->persist($user);

        try {
            $this->entityManager->flush();
        } catch (UniqueConstraintViolationException $exception) {
            throw new EmailAlreadyUsedException($exception);
        }

        if ($sendWelcomeEmail) {
            try {
                $this->sendWelcomeEmail($user);
            } catch (MailDispatchException $exception) {
                $this->entityManager->remove($user);
                $this->entityManager->flush();
                throw $exception;
            }
        }

        return $user;
    }

    /**
     * @throws MailDispatchException
     */
    private function sendWelcomeEmail(User $user): void
    {
        $recipient = $user->getEmail();

        if (!is_string($recipient) || $recipient === '') {
            return;
        }

        $context = [
            'first_name' => $recipient,
            'activate_link' => $this->emailVerifier->generateFrontendSignature($user),
        ];

        $this->mailer->dispatch($recipient, $this->welcomeTemplateId, $context);
    }
}
