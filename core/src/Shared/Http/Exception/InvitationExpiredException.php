<?php

declare(strict_types=1);

namespace App\Shared\Http\Exception;

use Symfony\Component\HttpKernel\Exception\GoneHttpException;

final class InvitationExpiredException extends GoneHttpException
{
    public function __construct(?\Throwable $previous = null)
    {
        parent::__construct('Invitation has expired.', $previous);
    }
}
