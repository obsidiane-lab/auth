<?php

declare(strict_types=1);

namespace Obsidiane\AuthBundle\Model;

final class FrontendConfig extends Item
{
    public ?string $id = null;
    public ?bool $registrationEnabled = null;
    public ?int $passwordStrengthLevel = null;
    public ?string $brandingName = null;
    public ?string $frontendDefaultRedirect = null;

    /**
     * @var list<string>|null
     */
    public ?array $frontendRedirectAllowlist = null;

    public ?string $themeMode = null;
    public ?string $themeColor = null;
    public ?string $themeDirection = null;

    /**
     * @var list<string>|null
     */
    public ?array $themeColors = null;
}
