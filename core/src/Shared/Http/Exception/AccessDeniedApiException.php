<?php

declare(strict_types=1);

namespace App\Shared\Http\Exception;

use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final class AccessDeniedApiException extends AccessDeniedHttpException
{
    public function __construct(?\Throwable $previous = null)
    {
        parent::__construct('Access denied.', $previous);
    }
}
