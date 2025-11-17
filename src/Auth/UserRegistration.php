<?php

namespace App\Auth;

use App\Auth\Dto\RegisterUserInput;
use App\Auth\Exception\RegistrationException;
use App\Entity\User;
use App\Mail\MailDispatchException;
use App\Mail\MailerGateway;
use App\Security\EmailVerifier;
use App\Security\PasswordStrengthChecker;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\ConstraintViolationInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final readonly class UserRegistration
{
    public function __construct(
        private ValidatorInterface          $validator,
        private UserPasswordHasherInterface $passwordHasher,
        private EntityManagerInterface      $entityManager,
        private MailerGateway               $mailer,
        private EmailVerifier               $emailVerifier,
        private PasswordStrengthChecker     $passwordStrengthChecker,
        #[Autowire('%env(string:NOTIFUSE_TEMPLATE_WELCOME)%')]
        private string                      $welcomeTemplateId = 'welcome',
    ) {
    }

    /**
     * @throws RegistrationException
     */
    public function register(RegisterUserInput $input): User
    {
        $violations = $this->validator->validate($input, groups: ['user:register']);

        if (count($violations) > 0) {
            $errors = [];

            foreach ($violations as $violation) {
                $path = $violation->getPropertyPath();
                $errors[$path] = $this->mapViolationToCode($path, $violation);
            }

            throw new RegistrationException($errors);
        }

        $plainPassword = (string) ($input->plainPassword ?? '');

        if (!$this->passwordStrengthChecker->isStrongEnough($plainPassword)) {
            throw new RegistrationException(['plainPassword' => 'INVALID_PASSWORD']);
        }

        $user = new User();
        $normalizedEmail = is_string($input->email) ? mb_strtolower(trim($input->email)) : '';
        $user->setEmail($normalizedEmail);
        $user->setPassword($this->passwordHasher->hashPassword($user, $plainPassword));
        $user->eraseCredentials();
        $user->setRoles([]);

        $this->entityManager->persist($user);

        try {
            $this->entityManager->flush();
        } catch (UniqueConstraintViolationException $exception) {
            throw new RegistrationException(['email' => 'EMAIL_ALREADY_USED'], $exception);
        }

        $user->setIsEmailVerified(false);

        try {
            $this->sendWelcomeEmail($user);
        } catch (MailDispatchException $exception) {
            throw new RegistrationException([], 'EMAIL_SEND_FAILED', $exception);
        }

        return $user;
    }

    private function mapViolationToCode(string $path, ConstraintViolationInterface $violation): string
    {
        return match ($path) {
            'email' => 'INVALID_EMAIL',
            'plainPassword' => 'INVALID_PASSWORD',
            default => $violation->getMessage(),
        };
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

        $signature = $this->emailVerifier->generateSignature($user);

        $context = [
            'first_name' => $recipient,
            'activate_link' => $signature->getSignedUrl(),
        ];

        $this->mailer->dispatch($recipient, $this->welcomeTemplateId, $context);
    }
}
