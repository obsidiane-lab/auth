<?php

namespace App\Dto\Auth;

use App\Validator\Constraints\PasswordStrengthConfig;
use Symfony\Component\Serializer\Attribute\SerializedName;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

final class RegisterUserInput
{
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Groups(['user:register'])]
    public ?string $email = null;

    #[Assert\NotBlank]
    #[PasswordStrengthConfig]
    #[SerializedName('password')]
    #[Groups(['user:register'])]
    public ?string $plainPassword = null;
}
