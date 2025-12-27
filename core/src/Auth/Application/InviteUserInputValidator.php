<?php

namespace App\Auth\Application;

use App\Auth\Domain\Exception\RegistrationException;
use App\Auth\Http\Dto\InviteUserInput;
use Symfony\Component\Validator\ConstraintViolationInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final readonly class InviteUserInputValidator
{
    public function __construct(
        private ValidatorInterface $validator,
    ) {
    }

    /**
     * @throws RegistrationException
     */
    public function validate(InviteUserInput $input): void
    {
        $violations = $this->validator->validate($input, groups: ['invite:send']);

        if (count($violations) === 0) {
            return;
        }

        $errors = [];

        foreach ($violations as $violation) {
            $path = $violation->getPropertyPath();
            $errors[$path] = $this->mapViolationToCode($path, $violation);
        }

        throw new RegistrationException($errors);
    }

    private function mapViolationToCode(string $path, ConstraintViolationInterface $violation): string
    {
        return match ($path) {
            'email' => 'INVALID_EMAIL',
            default => $violation->getMessage(),
        };
    }
}
