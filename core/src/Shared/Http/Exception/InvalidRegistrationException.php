<?php

declare(strict_types=1);

namespace App\Shared\Http\Exception;

use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

final class InvalidRegistrationException extends UnprocessableEntityHttpException
{
    /**
     * @var array<string, string>
     */
    private array $details;

    /**
     * @param array<string, string> $details
     */
    public function __construct(array $details = [], ?\Throwable $previous = null)
    {
        parent::__construct('Registration is invalid.', $previous);
        $this->details = $details;
    }

    /**
     * @return array<string, string>
     */
    public function getDetails(): array
    {
        return $this->details;
    }
}
