<?php

namespace App\Auth\View;

use App\Auth\RedirectPolicy;
use App\Config\FeatureFlags;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

final readonly class AuthViewPropsBuilder
{
    public function __construct(
        private RedirectPolicy $redirectPolicy,
        private FeatureFlags $featureFlags,
        private UrlGeneratorInterface $router,
        #[Autowire('%app.wording_name%')]
        private string $wordingName,
    ) {
    }

    /**
     * @return array{
     *     redirect_target: string,
     *     theme_color: string,
     *     theme_mode: string,
     *     props: array<string, mixed>
     * }
     */
    public function build(Request $request): array
    {
        $redirectTarget = $this->resolveRedirectTarget($request);
        $props = [
            'redirectTarget' => $redirectTarget,
            'endpoints' => $this->endpoints(),
            'pages' => $this->pageRoutes($request),
            'featureFlags' => $this->featureFlags->toFrontendConfig(),
            'themeColor' => $this->featureFlags->getThemeColor(),
            'themeMode' => $this->featureFlags->getThemeMode(),
            'wordingName' => $this->wordingName,
        ];

        $flashKey = $request->query->get('flash');
        if (is_string($flashKey) && $flashKey !== '') {
            $props['flashMessageKey'] = $flashKey;
        }

        return [
            'redirect_target' => $redirectTarget,
            'theme_color' => $this->featureFlags->getThemeColor(),
            'theme_mode' => $this->featureFlags->getThemeMode(),
            'props' => $props,
        ];
    }

    private function resolveRedirectTarget(Request $request): string
    {
        $redirectUri = $request->query->get('redirect_uri');

        if (is_string($redirectUri) && $this->redirectPolicy->isAllowed($redirectUri)) {
            return $redirectUri;
        }

        return $this->redirectPolicy->getDefaultRedirect();
    }

    /**
     * @return array<string, string>
     */
    private function endpoints(): array
    {
        return [
            'login' => '/api/auth/login',
            'register' => $this->router->generate('api_auth_register'),
            'request' => $this->router->generate('api_auth_password_forgot'),
            'reset' => $this->router->generate('api_auth_password_reset'),
            'refresh' => '/api/auth/refresh',
        ];
    }

    /**
     * @return array<string, string>
     */
    private function pageRoutes(Request $request): array
    {
        $query = $this->sharedPageQuery($request);

        return [
            'login' => $this->router->generate('auth_login_page', $query),
            'register' => $this->router->generate('auth_register_page', $query),
            'forgot' => $this->router->generate('app_forgot_password_request', $query),
            'reset' => $this->router->generate('app_reset_password', $query),
        ];
    }

    /**
     * @return array<string, string>
     */
    private function sharedPageQuery(Request $request): array
    {
        $allowedKeys = ['redirect_uri'];
        $query = [];

        foreach ($allowedKeys as $key) {
            $value = $request->query->get($key);

            if (!is_string($value) || $value === '') {
                continue;
            }

            $query[$key] = $value;
        }

        return $query;
    }
}
