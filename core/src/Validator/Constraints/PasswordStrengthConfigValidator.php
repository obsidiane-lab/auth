<?php

namespace App\Validator\Constraints;

use App\Security\PasswordStrengthChecker;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Constraints\PasswordStrength;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

final class PasswordStrengthConfigValidator extends ConstraintValidator
{
    public function __construct(
        private PasswordStrengthChecker $passwordStrengthChecker,
    ) {
    }

    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$constraint instanceof PasswordStrengthConfig) {
            throw new UnexpectedTypeException($constraint, PasswordStrengthConfig::class);
        }

        if ($value === null || $value === '') {
            return;
        }

        if (!is_string($value)) {
            throw new UnexpectedTypeException($value, 'string');
        }

        $minScore = $constraint->minScore ?? $this->passwordStrengthChecker->getMinScore();

        $passwordConstraint = new PasswordStrength([
            'minScore' => $minScore,
            'message' => $constraint->message,
        ]);

        $violations = $this->context->getValidator()->validate($value, $passwordConstraint);

        foreach ($violations as $violation) {
            $this->context->addViolation($violation->getMessage());
        }
    }
}
