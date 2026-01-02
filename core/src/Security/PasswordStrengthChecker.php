<?php

declare(strict_types=1);

namespace App\Security;

use Symfony\Component\Validator\Constraints\PasswordStrength;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

final class PasswordStrengthChecker
{
    private int $minScore;

    public function __construct(
        private ValidatorInterface $validator,
        #[Autowire('%app.password_strength_level%')]
        int $minScore,
    ) {
        $this->minScore = max(
            PasswordStrength::STRENGTH_WEAK,
            min(PasswordStrength::STRENGTH_VERY_STRONG, $minScore)
        );
    }

    public function isStrongEnough(string $password): bool
    {
        $password = trim($password);

        if ($password === '') {
            return false;
        }

        $constraint = new PasswordStrength([
            'minScore' => $this->minScore,
        ]);

        $violations = $this->validator->validate($password, $constraint);

        return count($violations) === 0;
    }

    public function getMinScore(): int
    {
        return $this->minScore;
    }
}
