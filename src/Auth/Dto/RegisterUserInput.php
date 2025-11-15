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
    #[Assert\Length(min: 8)]
    #[Groups(['user:register'])]
    public ?string $plainPassword = null;

    #[Assert\NotNull]
    #[Assert\Valid]
    #[Groups(['user:register'])]
    public ?RegisterIdentityInput $identity = null;
}
