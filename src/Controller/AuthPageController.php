<?php

namespace App\Controller;

use App\Config\FeatureFlags;
use App\Setup\InitialAdminManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/', name: 'auth_page', methods: ['GET'])]
final class AuthPageController extends AbstractController
{
    public function __construct(
        private readonly FeatureFlags $featureFlags,
        private readonly InitialAdminManager $initialAdminManager,
    ) {
    }

    public function __invoke(Request $request): RedirectResponse
    {
        if ($this->initialAdminManager->needsBootstrap()) {
            return $this->redirectToRoute('setup_admin_page');
        }

        if (!$this->featureFlags->isUiEnabled()) {
            throw new NotFoundHttpException();
        }

        $view = $request->query->get('view', 'login');
        $route = match ($view) {
            'register' => 'auth_register_page',
            'forgot' => 'app_forgot_password_request',
            'reset' => 'app_reset_password',
            default => 'auth_login_page',
        };

        return $this->redirectToRoute($route, $request->query->all());
    }
}
