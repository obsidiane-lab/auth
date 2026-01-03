<?php

declare(strict_types=1);

namespace App\Exception\Setup;

use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class InitialAdminAlreadyCreatedException extends ConflictHttpException
{
    public function __construct(?\Throwable $previous = null)
    {
        parent::__construct('Initial admin already created.', $previous);
    }
}
