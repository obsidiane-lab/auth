<?php

declare(strict_types=1);

namespace App\Shared\Http\Exception;

use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

final class InvalidEmailException extends UnprocessableEntityHttpException
{
    public function __construct(?\Throwable $previous = null)
    {
        parent::__construct('Invalid email address.', $previous);
    }
}
