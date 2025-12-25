<?php

declare(strict_types=1);

namespace App\Config;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

final class FeatureFlags
{
    private const DEFAULT_THEME_COLOR = 'red';
    private const DEFAULT_THEME_MODE = 'dark';

    public function __construct(
        #[Autowire('%env(bool:UI_ENABLED)%')]
        private readonly bool $uiEnabled,
        #[Autowire('%env(bool:REGISTRATION_ENABLED)%')]
        private readonly bool $registrationEnabled,
        #[Autowire('%env(string:UI_THEME_COLOR)%')]
        private readonly string $themeColor,
        #[Autowire('%env(string:UI_THEME_MODE)%')]
        private readonly string $themeMode,
    ) {
    }

    public function isUiEnabled(): bool
    {
        return $this->uiEnabled;
    }

    public function isRegistrationEnabled(): bool
    {
        return $this->registrationEnabled;
    }

    public function getThemeColor(): string
    {
        $color = trim($this->themeColor);

        if ($color === '') {
            return self::DEFAULT_THEME_COLOR;
        }

        $normalized = preg_replace('/[^a-z0-9_-]/i', '', strtolower($color)) ?? '';

        return $normalized !== '' ? $normalized : self::DEFAULT_THEME_COLOR;
    }

    /**
     * @return array<string, bool|string>
     */
    public function toFrontendConfig(): array
    {
        return [
            'registrationEnabled' => $this->isRegistrationEnabled(),
            'themeMode' => $this->getThemeMode(),
        ];
    }

    public function getThemeMode(): string
    {
        $mode = strtolower(trim($this->themeMode));

        if ($mode === 'light' || $mode === 'dark') {
            return $mode;
        }

        return self::DEFAULT_THEME_MODE;
    }
}
