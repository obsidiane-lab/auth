<?php

namespace App\Validator\Constraints;

use Symfony\Component\Validator\Constraint;

#[\Attribute(\Attribute::TARGET_PROPERTY | \Attribute::TARGET_METHOD)]
final class PasswordStrengthConfig extends Constraint
{
    public ?int $minScore = null;
    public string $message = 'The password strength is too weak. Please use a stronger password.';

    public function validatedBy(): string
    {
        return PasswordStrengthConfigValidator::class;
    }
}
