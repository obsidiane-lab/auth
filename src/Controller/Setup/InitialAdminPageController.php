<?php

namespace App\Controller\Setup;

use App\Setup\InitialAdminManager;
use App\Setup\SetupViewPropsBuilder;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/setup', name: 'setup_admin_page', methods: ['GET'])]
final class InitialAdminPageController extends AbstractController
{
    public function __construct(
        private readonly InitialAdminManager $initialAdminManager,
        private readonly SetupViewPropsBuilder $viewPropsBuilder,
    ) {
    }

    public function __invoke(Request $request): Response
    {
        if (!$this->initialAdminManager->needsBootstrap()) {
            throw new NotFoundHttpException();
        }

        $context = $this->viewPropsBuilder->build($request);

        return $this->render('setup/initial_admin.html.twig', [
            'component_props' => $context['props'],
            'theme_color' => $context['theme_color'],
            'theme_mode' => $context['theme_mode'],
        ]);
    }
}

