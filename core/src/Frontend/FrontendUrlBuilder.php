<?php

namespace App\Frontend;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Routing\Generator\UrlGenerator;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Routing\RequestContext;
use Symfony\Component\Routing\Route;
use Symfony\Component\Routing\RouteCollection;

final readonly class FrontendUrlBuilder
{
    private UrlGeneratorInterface $urlGenerator;

    public function __construct(
        #[Autowire('%env(APP_BASE_URL)%')]
        string $frontendBaseUrl,
    ) {
        $this->urlGenerator = $this->createGenerator($frontendBaseUrl);
    }

    /**
     * @param array<string, scalar> $query
     */
    public function verifyEmailUrl(array $query): string
    {
        return $this->generate('frontend_verify_email', $query);
    }

    public function resetPasswordUrl(string $token): string
    {
        return $this->generate('frontend_reset_password_confirm', ['token' => $token]);
    }

    public function inviteCompleteUrl(string $token): string
    {
        return $this->generate('frontend_invite_complete', ['token' => $token]);
    }

    /**
     * @param array<string, scalar> $query
     */
    private function generate(string $route, array $query = []): string
    {
        return $this->urlGenerator->generate($route, $query, UrlGeneratorInterface::ABSOLUTE_URL);
    }

    private function createGenerator(string $frontendBaseUrl): UrlGeneratorInterface
    {
        $parts = parse_url($frontendBaseUrl);
        if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
            throw new \RuntimeException('APP_BASE_URL must be an absolute URL.');
        }

        $context = RequestContext::fromUri($frontendBaseUrl);
        $context->setBaseUrl(rtrim($context->getBaseUrl(), '/'));

        $routes = new RouteCollection();
        $routes->add('frontend_verify_email', new Route('/verify-email'));
        $routes->add('frontend_reset_password_confirm', new Route('/reset-password/confirm'));
        $routes->add('frontend_invite_complete', new Route('/invite/complete'));

        return new UrlGenerator($routes, $context);
    }
}
