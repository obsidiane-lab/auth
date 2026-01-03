<?php

namespace App\Utils;

final class EmailNormalizer
{
    public function normalize(?string $email): string
    {
        $value = is_string($email) ? trim($email) : '';

        if ($value === '') {
            return '';
        }

        return mb_strtolower($value);
    }
}
