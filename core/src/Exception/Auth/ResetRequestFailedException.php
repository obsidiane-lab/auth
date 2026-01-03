<?php

declare(strict_types=1);

namespace App\Exception\Auth;

use Symfony\Component\HttpKernel\Exception\HttpException;

final class ResetRequestFailedException extends HttpException
{
    public function __construct(?\Throwable $previous = null)
    {
        parent::__construct(500, 'Password reset request failed.', $previous);
    }
}
