<?php

namespace App\Auth\Application;

use App\Auth\Http\Dto\RegisterUserInput;
use App\Auth\Domain\Exception\RegistrationException;
use App\Entity\User;
use App\Shared\Mail\MailDispatchException;
use App\Shared\Mail\MailerGateway;
use App\Auth\Infrastructure\Security\EmailVerifier;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

final readonly class RegisterUser
{
    public function __construct(
        private RegisterUserInputValidator $inputValidator,
        private EntityManagerInterface      $entityManager,
        private MailerGateway               $mailer,
        private EmailVerifier               $emailVerifier,
        private UserFactory                 $userFactory,
        #[Autowire('%env(string:NOTIFUSE_TEMPLATE_WELCOME)%')]
        private string                      $welcomeTemplateId = 'welcome',
    ) {
    }

    /**
     * @throws RegistrationException
     */
    public function handle(RegisterUserInput $input): User
    {
        $this->inputValidator->validate($input);
        $plainPassword = (string) ($input->plainPassword ?? '');

        $user = $this->userFactory->create((string) ($input->email ?? ''), $plainPassword);

        $this->entityManager->persist($user);

        try {
            $this->entityManager->flush();
        } catch (UniqueConstraintViolationException $exception) {
            throw new RegistrationException(['email' => 'EMAIL_ALREADY_USED'], 'EMAIL_ALREADY_USED', $exception);
        }

        try {
            $this->sendWelcomeEmail($user);
        } catch (MailDispatchException $exception) {
            $this->entityManager->remove($user);
            $this->entityManager->flush();
            throw new RegistrationException([], 'EMAIL_SEND_FAILED', $exception);
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
