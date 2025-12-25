<?php

namespace App\Auth\Dto;

use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

final class RegisterUserInput
{
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Groups(['user:register'])]
    public ?string $email = null;

    #[Assert\NotBlank]
    #[Groups(['user:register'])]
    public ?string $plainPassword = null;
}
