<?php

declare(strict_types=1);

namespace App\Shared\Http\Exception;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class InvalidUserException extends BadRequestHttpException
{
    public function __construct(?\Throwable $previous = null)
    {
        parent::__construct('Invalid user.', $previous);
    }
}
