<?php

namespace App\Auth\Application;

use App\Shared\Http\Exception\InvalidRegistrationException;
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
     * @throws InvalidRegistrationException
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

            throw new InvalidRegistrationException($errors);
        }

        $plainPassword = (string) ($input->plainPassword ?? '');

        if (!$this->passwordStrengthChecker->isStrongEnough($plainPassword)) {
            throw new InvalidRegistrationException(['plainPassword' => 'INVALID_PASSWORD']);
        }
    }

    private function mapViolationToCode(string $path, ConstraintViolationInterface $violation): string
    {
        return match ($path) {
            'email' => 'INVALID_EMAIL',
            'plainPassword' => 'INVALID_PASSWORD',
            default => 'INVALID_PAYLOAD',
        };
    }
}
