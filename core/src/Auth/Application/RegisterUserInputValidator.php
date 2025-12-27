<?php

namespace App\Auth\Application;

use App\Auth\Domain\Exception\RegistrationException;
use App\Auth\Http\Dto\RegisterUserInput;
use App\Shared\Security\PasswordStrengthChecker;
use Symfony\Component\Validator\ConstraintViolationInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final readonly class RegisterUserInputValidator
{
    public function __construct(
        private ValidatorInterface $validator,
        private PasswordStrengthChecker $passwordStrengthChecker,
    ) {
    }

    /**
     * @throws RegistrationException
     */
    public function validate(RegisterUserInput $input): void
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
