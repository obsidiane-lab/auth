<?php

namespace App\Auth\Dto;

use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

final class InviteCompleteInput
{
    #[Assert\NotBlank]
    #[Groups(['invite:complete'])]
    public ?string $token = null;

    #[Assert\NotBlank]
    #[Groups(['invite:complete'])]
    public ?string $password = null;

    #[Assert\NotBlank]
    #[Groups(['invite:complete'])]
    public ?string $confirmPassword = null;
}
