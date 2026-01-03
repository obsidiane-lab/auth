<?php

namespace App\Dto\Auth;

use App\Validator\Constraints\PasswordStrengthConfig;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

final class PasswordResetInput
{
    #[Assert\NotBlank]
    #[Groups(['password:reset'])]
    public string $token = '';

    #[Assert\NotBlank]
    #[PasswordStrengthConfig]
    #[Groups(['password:reset'])]
    public string $password = '';
}
