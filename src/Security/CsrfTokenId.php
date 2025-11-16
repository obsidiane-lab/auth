<?php

namespace App\Security;

enum CsrfTokenId: string
{
    case AUTHENTICATE = 'authenticate';
    case REGISTER = 'register';
    case PASSWORD_REQUEST = 'password_request';
    case PASSWORD_RESET = 'password_reset';
    case LOGOUT = 'logout';
    case INITIAL_ADMIN = 'initial_admin';
    case INVITE_USER = 'invite_user';
    case INVITE_COMPLETE = 'invite_complete';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(fn (self $case) => $case->value, self::cases());
    }

    public static function fromValue(string $value): ?self
    {
        return self::tryFrom($value);
    }
}
