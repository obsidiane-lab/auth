<?php

namespace App\Controller;

use App\Config\FeatureFlags;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/favicon.svg', name: 'app_favicon', methods: ['GET'])]
final class LogoIconController extends AbstractController
{
    public function __construct(
        private readonly FeatureFlags $featureFlags,
    ) {
    }

    public function __invoke(): Response
    {
        return $this->render('icons/logo.svg.twig', [
            'active_theme_color' => $this->featureFlags->getThemeColor(),
        ], new Response(headers: ['Content-Type' => 'image/svg+xml']));
    }
}

