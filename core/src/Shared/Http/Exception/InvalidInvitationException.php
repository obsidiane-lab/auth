<?php

declare(strict_types=1);

namespace App\Shared\Http\Exception;

use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class InvalidInvitationException extends NotFoundHttpException
{
    public function __construct(?\Throwable $previous = null)
    {
        parent::__construct('Invalid invitation.', $previous);
    }
}
