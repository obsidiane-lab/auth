<?php

namespace App\Auth\Dto;

use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

final class PasswordResetInput
{
    #[Assert\NotBlank]
    #[Groups(['password:reset'])]
    public ?string $token = null;

    #[Assert\NotBlank]
    #[Groups(['password:reset'])]
    public ?string $password = null;
}
