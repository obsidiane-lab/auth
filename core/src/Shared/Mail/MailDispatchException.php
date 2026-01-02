<?php

namespace App\Shared\Mail;

use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

final class MailDispatchException extends ServiceUnavailableHttpException
{
    public function __construct(?\Throwable $previous = null)
    {
        parent::__construct(null, 'Unable to send email.', $previous);
    }
}
