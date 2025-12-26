<?php

namespace App\Auth\Dto;

use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

final class PasswordForgotInput
{
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Groups(['password:forgot'])]
    public ?string $email = null;
}
