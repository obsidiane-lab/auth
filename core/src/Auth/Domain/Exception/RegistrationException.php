<?php

namespace App\Auth\Domain\Exception;

use Throwable;

final class RegistrationException extends \RuntimeException
{
    /**
     * @param array<string, string> $errors
     */
    public function __construct(
        private array $errors,
        string $message = 'INVALID_REGISTRATION_DATA',
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }

    /**
     * @return array<string, string>
     */
    public function getErrors(): array
    {
        return $this->errors;
    }
}
