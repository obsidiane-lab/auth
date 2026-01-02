<?php

declare(strict_types=1);

namespace App\Exception\Security;

use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

final class RateLimitException extends TooManyRequestsHttpException
{
    public function __construct(?int $retryAfter = null, ?\Throwable $previous = null)
    {
        parent::__construct($retryAfter, 'Too many requests.', $previous);
    }
}
