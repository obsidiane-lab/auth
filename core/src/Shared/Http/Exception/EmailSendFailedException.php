<?php

declare(strict_types=1);

namespace App\Shared\Http\Exception;

use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

final class EmailSendFailedException extends ServiceUnavailableHttpException
{
    public function __construct(?int $retryAfter = null, ?\Throwable $previous = null)
    {
        parent::__construct($retryAfter, 'Unable to send email.', $previous);
    }
}
