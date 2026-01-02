<?php

declare(strict_types=1);

namespace App\Exception\Auth;

use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class EmailAlreadyUsedException extends ConflictHttpException
{
    public function __construct(?\Throwable $previous = null)
    {
        parent::__construct('Email is already in use.', $previous);
    }
}
