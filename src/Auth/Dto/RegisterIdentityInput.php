<?php

namespace App\Auth\Dto;

use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

class RegisterIdentityInput
{

    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 120)]
    #[Groups(['user:register'])]
    public ?string $displayName = null;
}
