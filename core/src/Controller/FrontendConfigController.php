<?php

namespace App\Controller;

use App\ApiResource\FrontendConfig;
use App\Config\FeatureFlags;
use App\Security\PasswordStrengthChecker;
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
        #[Autowire('%kernel.environment%')]
        private string $environment,
        #[Autowire('%env(string:FRONTEND_REDIRECT_URL)%')]
        private string $frontendRedirectUrl,
        #[Autowire('%env(FRONTEND_THEME_MODE)%')]
        private string $themeMode,
        #[Autowire('%env(FRONTEND_THEME_COLOR)%')]
        private string $themeColor,
    ) {
    }

    public function __invoke(): FrontendConfig
    {
        $config = new FrontendConfig();
        $config->id = 'frontend';
        $config->registrationEnabled = $this->featureFlags->isRegistrationEnabled();
        $config->passwordStrengthLevel = $this->passwordStrengthChecker->getMinScore();
        $config->brandingName = $this->brandingName;
        $config->frontendRedirectUrl = $this->frontendRedirectUrl;
        $config->environment = $this->environment;
        $config->themeMode = $this->themeMode;
        $config->themeColor = $this->themeColor;
        return $config;
    }

}
