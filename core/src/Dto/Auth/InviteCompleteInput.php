<?php

namespace App\Dto\Auth;

use App\Validator\Constraints\PasswordStrengthConfig;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

final class InviteCompleteInput
{
    #[Assert\NotBlank]
    #[Groups(['invite:complete'])]
    public string $token = '';

    #[Assert\NotBlank]
    #[PasswordStrengthConfig]
    #[Groups(['invite:complete'])]
    public string $password = '';

    #[Assert\NotBlank]
    #[Assert\EqualTo(propertyPath: 'password', message: 'Passwords must match')]
    #[Groups(['invite:complete'])]
    public string $confirmPassword = '';
}
