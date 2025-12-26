<?php

namespace App\Auth\Dto;

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
    #[SerializedName('password')]
    #[Groups(['user:register'])]
    public ?string $plainPassword = null;
}
