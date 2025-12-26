<?php

namespace App\Auth\Dto;

use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

final class InviteUserInput
{
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Groups(['invite:send'])]
    public ?string $email = null;
}
