<?php

declare(strict_types=1);

namespace App\Shared\Http\Exception;

use Symfony\Component\HttpKernel\Exception\HttpException;

final class RefreshTokenInvalidException extends HttpException
{
    public function __construct(?\Throwable $previous = null)
    {
        parent::__construct(401, 'Invalid refresh token.', $previous);
    }
}
