<?php

namespace App\Auth\Application;

use App\Shared\Http\Exception\InvalidInvitationPayloadException;
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
     * @throws InvalidInvitationPayloadException
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

        throw new InvalidInvitationPayloadException($errors);
    }

    private function mapViolationToCode(string $path, ConstraintViolationInterface $violation): string
    {
        return match ($path) {
            'email' => 'INVALID_EMAIL',
            default => 'INVALID_PAYLOAD',
        };
    }
}
