<?php

namespace App\Auth\Domain\Exception;

final class PasswordResetException extends \RuntimeException
{
    public function __construct(
        private string $errorCode,
        private int $statusCode,
        ?\Throwable $previous = null,
    ) {
        parent::__construct($errorCode, 0, $previous);
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}
