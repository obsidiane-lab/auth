<?php

namespace App\Shared\Http\Controller;

use App\ApiResource\FrontendConfig;
use App\Shared\Config\FeatureFlags;
use App\Shared\Security\PasswordStrengthChecker;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

#[AsController]
final readonly class FrontendConfigController
{
    public function __construct(
        private FeatureFlags $featureFlags,
        private PasswordStrengthChecker $passwordStrengthChecker,
        #[Autowire('%app.wording_name%')]
        private string $brandingName,
        #[Autowire('%env(string:FRONTEND_DEFAULT_REDIRECT)%')]
        private string $frontendDefaultRedirect,
        #[Autowire('%env(string:FRONTEND_REDIRECT_ALLOWLIST)%')]
        private string $frontendRedirectAllowlist,
        #[Autowire('%env(FRONTEND_THEME_MODE)%')]
        private string $themeMode,
        #[Autowire('%env(FRONTEND_THEME_COLOR)%')]
        private string $themeColor,
        #[Autowire('%env(FRONTEND_THEME_DIRECTION)%')]
        private string $themeDirection,
        #[Autowire('%env(FRONTEND_THEME_COLORS)%')]
        private string $themeColors,
    ) {
    }

    public function __invoke(): FrontendConfig
    {
        $config = new FrontendConfig();
        $config->id = 'frontend';
        $config->registrationEnabled = $this->featureFlags->isRegistrationEnabled();
        $config->passwordStrengthLevel = $this->passwordStrengthChecker->getMinScore();
        $config->brandingName = $this->brandingName;
        $config->frontendDefaultRedirect = $this->frontendDefaultRedirect;
        $config->frontendRedirectAllowlist = $this->normalizeList($this->frontendRedirectAllowlist);
        $config->themeMode = $this->themeMode;
        $config->themeColor = $this->themeColor;
        $config->themeDirection = $this->themeDirection;
        $config->themeColors = $this->normalizeThemes($this->themeColors, $this->themeColor);
        return $config;
    }

    /**
     * @return list<string>
     */
    private function normalizeThemes(string $raw, string $default): array
    {
        $values = array_filter(array_map('trim', explode(',', $raw)), static fn (string $value) => $value !== '');
        $unique = array_values(array_unique($values));

        if ($default !== '' && !in_array($default, $unique, true)) {
            array_unshift($unique, $default);
        }

        return $unique;
    }

    /**
     * @return list<string>
     */
    private function normalizeList(string $raw): array
    {
        $values = array_filter(array_map('trim', explode(',', $raw)), static fn (string $value) => $value !== '');
        return array_values(array_unique($values));
    }
}
