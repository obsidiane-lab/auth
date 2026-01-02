<?php

declare(strict_types=1);

namespace App\Exception\Auth;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class InvalidInvitationPayloadException extends BadRequestHttpException
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
        parent::__construct('Invalid invitation payload.', $previous);
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
