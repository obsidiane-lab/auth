<?php

namespace App\Controller;

use App\Auth\View\AuthViewPropsBuilder;
use App\Config\FeatureFlags;
use App\Security\CsrfTokenId;
use App\Setup\InitialAdminManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/register', name: 'auth_register_page', methods: ['GET'])]
final class AuthRegisterPageController extends AbstractController
{
    public function __construct(
        private readonly FeatureFlags $featureFlags,
        private readonly AuthViewPropsBuilder $viewPropsBuilder,
        private readonly InitialAdminManager $initialAdminManager,
    ) {
    }

    public function __invoke(Request $request): Response
    {
        if ($this->initialAdminManager->needsBootstrap()) {
            return $this->redirectToRoute('setup_admin_page');
        }

        if (!$this->featureFlags->isUiEnabled()) {
            throw new NotFoundHttpException();
        }

        $context = $this->viewPropsBuilder->build($request, [CsrfTokenId::REGISTER]);

        return $this->render('auth/register.html.twig', [
            'component_props' => $context['props'],
            'theme_color' => $context['theme_color'],
            'theme_mode' => $context['theme_mode'],
        ]);
    }
}
