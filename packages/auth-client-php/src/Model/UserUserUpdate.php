<?php

declare(strict_types=1);

namespace Obsidiane\AuthBundle\Model;

final class UserUserUpdate extends Item
{
    public string $email = '';
    public ?string $plainPassword = null;
}
