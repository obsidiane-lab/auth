<?php

declare(strict_types=1);

namespace App\Shared\Http\Exception;

use Symfony\Component\HttpKernel\Exception\HttpException;

final class EmailNotVerifiedException extends HttpException
{
    public function __construct(?\Throwable $previous = null)
    {
        parent::__construct(401, 'Email is not verified.', $previous);
    }
}
