<?php

declare(strict_types=1);

namespace App\Setup;

use App\Config\FeatureFlags;
use App\Security\PasswordStrengthChecker;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

final class SetupViewPropsBuilder
{
    public function __construct(
        private readonly FeatureFlags $featureFlags,
        private readonly UrlGeneratorInterface $router,
        private readonly PasswordStrengthChecker $passwordStrengthChecker,
        #[Autowire('%app.wording_name%')]
        private readonly string $wordingName,
    ) {
    }

    /**
     * @return array{props: array<string, mixed>, theme_color: string, theme_mode: string}
     */
    public function build(Request $request): array
    {
        $props = [
            'endpoints' => [
                'submit' => $this->router->generate('api_setup_initial_admin'),
            ],
            'wordingName' => $this->wordingName,
            'themeColor' => $this->featureFlags->getThemeColor(),
            'themeMode' => $this->featureFlags->getThemeMode(),
            'pages' => [
                'login' => $this->router->generate('auth_login_page'),
            ],
            'passwordPolicy' => [
                'minScore' => $this->passwordStrengthChecker->getMinScore(),
            ],
        ];

        return [
            'props' => $props,
            'theme_color' => $this->featureFlags->getThemeColor(),
            'theme_mode' => $this->featureFlags->getThemeMode(),
        ];
    }
}
